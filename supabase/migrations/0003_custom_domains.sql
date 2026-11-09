create table if not exists public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  hostname text not null,
  is_verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hostname)
);

alter table public.funnels
  add column if not exists custom_domain_id uuid references public.custom_domains(id) on delete set null;

create index if not exists custom_domains_workspace_idx on public.custom_domains(workspace_id);
create index if not exists funnels_custom_domain_idx on public.funnels(custom_domain_id);

alter table public.custom_domains enable row level security;

create policy "members can manage custom domains"
  on public.custom_domains for all
  to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

create policy "public can resolve active custom domains"
  on public.custom_domains for select
  to anon, authenticated
  using (is_verified = true);

drop policy if exists "members can manage funnels" on public.funnels;

create policy "members can manage funnels"
  on public.funnels for all
  to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (
    private.is_workspace_member(workspace_id)
    and (
      custom_domain_id is null
      or exists (
        select 1 from public.custom_domains
        where custom_domains.id = funnels.custom_domain_id
          and custom_domains.workspace_id = funnels.workspace_id
      )
    )
  );
