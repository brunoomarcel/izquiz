-- Back up the legacy values before removing the duplicate representation.
create table if not exists private.step_text_blocks_legacy_backup (
  step_id uuid primary key references public.funnel_steps(id) on delete cascade,
  original_settings jsonb not null,
  legacy_text_blocks jsonb not null,
  migrated_block_ids uuid[] not null default '{}',
  backed_up_at timestamptz not null default now()
);
alter table private.step_text_blocks_legacy_backup
  add column if not exists migrated_block_ids uuid[] not null default '{}';

revoke all on private.step_text_blocks_legacy_backup from public, anon, authenticated;

-- Convert valid legacy textBlocks exactly once. Existing canonical blocks stay in
-- place; converted text blocks are appended in their original array order.
do $$
declare
  step_row record;
  next_position integer;
  entry record;
  inserted_block_id uuid;
  inserted_block_ids uuid[];
begin
  for step_row in
    select id, settings
    from public.funnel_steps
    where jsonb_typeof(settings->'textBlocks') = 'array'
      and not exists (
        select 1 from private.step_text_blocks_legacy_backup b where b.step_id = funnel_steps.id
      )
    order by funnel_id, position, id
  loop
    insert into private.step_text_blocks_legacy_backup(step_id, original_settings, legacy_text_blocks)
    values (step_row.id, step_row.settings, step_row.settings->'textBlocks');

    select coalesce(max(position) + 1, 0) into next_position
    from public.step_blocks where step_id = step_row.id;
    inserted_block_ids := '{}';

    for entry in
      select value, ordinality
      from jsonb_array_elements(step_row.settings->'textBlocks') with ordinality
      where value->>'type' = 'text'
        and jsonb_typeof(value->'content') = 'string'
      order by ordinality
    loop
      insert into public.step_blocks(step_id, position, block_type, content)
      values (
        step_row.id,
        next_position,
        'Texto',
        (entry.value - 'type') || jsonb_build_object('content', entry.value->'content')
      ) returning id into inserted_block_id;
      inserted_block_ids := array_append(inserted_block_ids, inserted_block_id);
      next_position := next_position + 1;
    end loop;

    update private.step_text_blocks_legacy_backup
    set migrated_block_ids = inserted_block_ids
    where step_id = step_row.id;

    update public.funnel_steps
    set settings = settings - 'textBlocks', updated_at = now()
    where id = step_row.id;
  end loop;
end $$;

-- Any canonical block change advances the step timestamp. Clients use that
-- timestamp as an optimistic concurrency token so stale editor snapshots fail.
create or replace function private.touch_funnel_step_blocks_revision()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  target_step uuid;
begin
  target_step := case when tg_op = 'DELETE' then old.step_id else new.step_id end;
  update public.funnel_steps set updated_at = clock_timestamp() where id = target_step;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists step_blocks_touch_step_revision on public.step_blocks;
create trigger step_blocks_touch_step_revision
after insert or update or delete on public.step_blocks
for each row execute function private.touch_funnel_step_blocks_revision();

create or replace function public.sync_step_blocks(p_step_id uuid, p_blocks jsonb, p_expected_updated_at timestamptz)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  current_step_updated_at timestamptz;
  payload jsonb;
  item jsonb;
  supplied_id uuid;
  item_position integer := 0;
  temp_base integer;
  result jsonb;
begin
  if jsonb_typeof(p_blocks) is distinct from 'array' or jsonb_array_length(p_blocks) > 200 then
    raise exception 'p_blocks precisa ser um array com até 200 itens';
  end if;

  select updated_at into current_step_updated_at
  from public.funnel_steps
  where id = p_step_id
  for update;
  if not found then raise exception 'Etapa não encontrada ou não autorizada'; end if;

  -- Serialize writers for a step and reject stale snapshots.
  perform pg_advisory_xact_lock(hashtextextended(p_step_id::text, 0));
  select updated_at into current_step_updated_at from public.funnel_steps where id = p_step_id;
  if current_step_updated_at is distinct from p_expected_updated_at then
    raise exception 'A etapa mudou em outra sessão. Recarregue para evitar sobrescrever alterações.' using errcode = '40001';
  end if;

  -- Validate IDs/types/properties before mutating any row.
  for item in select value from jsonb_array_elements(p_blocks)
  loop
    if coalesce(btrim(item->>'type'), '') = '' or jsonb_typeof(item->'properties') is distinct from 'object' then
      raise exception 'Cada bloco precisa de type e properties (objeto JSON)';
    end if;
    if item ? 'id' and item->>'id' is not null then
      begin supplied_id := (item->>'id')::uuid;
      exception when invalid_text_representation then raise exception 'UUID de bloco inválido'; end;
      if not exists (select 1 from public.step_blocks where id = supplied_id and step_id = p_step_id) then
        raise exception 'Bloco ausente nesta etapa; recarregue antes de salvar';
      end if;
    end if;
  end loop;

  select coalesce(max(position) + jsonb_array_length(p_blocks) + 1000, 1000)
  into temp_base from public.step_blocks where step_id = p_step_id;
  update public.step_blocks set position = position + temp_base where step_id = p_step_id;

  delete from public.step_blocks b
  where b.step_id = p_step_id
    and not exists (
      select 1 from jsonb_array_elements(p_blocks) i
      where nullif(i->>'id', '') is not null and (i->>'id')::uuid = b.id
    );

  for item in select value from jsonb_array_elements(p_blocks)
  loop
    if nullif(item->>'id', '') is null then
      insert into public.step_blocks(step_id, position, block_type, content)
      values (p_step_id, item_position, item->>'type', item->'properties');
    else
      supplied_id := (item->>'id')::uuid;
      update public.step_blocks
      set position = item_position, block_type = item->>'type', content = item->'properties'
      where id = supplied_id and step_id = p_step_id;
    end if;
    item_position := item_position + 1;
  end loop;

  update public.funnel_steps set updated_at = clock_timestamp() where id = p_step_id
  returning updated_at into current_step_updated_at;

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'position', position) order by position), '[]'::jsonb)
  into result from public.step_blocks where step_id = p_step_id;
  return jsonb_build_object('blocks', result, 'updatedAt', current_step_updated_at);
end;
$$;

revoke all on function public.sync_step_blocks(uuid, jsonb, timestamptz) from public, anon;
grant execute on function public.sync_step_blocks(uuid, jsonb, timestamptz) to authenticated;
grant execute on function public.sync_step_blocks(uuid, jsonb, timestamptz) to service_role;
