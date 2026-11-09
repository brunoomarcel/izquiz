-- Permite que o quiz publicado seja acessado sem login.
-- O editor continua protegido pelas políticas de workspace autenticado.
create policy "public can read published funnels"
  on public.funnels for select
  to anon, authenticated
  using (status = 'published');

create policy "public can read published funnel steps"
  on public.funnel_steps for select
  to anon, authenticated
  using (exists (
    select 1
    from public.funnels
    where funnels.id = funnel_steps.funnel_id
      and funnels.status = 'published'
  ));

create policy "public can read published step blocks"
  on public.step_blocks for select
  to anon, authenticated
  using (exists (
    select 1
    from public.funnel_steps
    join public.funnels on funnels.id = funnel_steps.funnel_id
    where funnel_steps.id = step_blocks.step_id
      and funnels.status = 'published'
  ));
