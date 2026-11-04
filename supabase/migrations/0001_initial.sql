create extension if not exists "pgcrypto";

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Meu workspace',
  slug text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.funnels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  settings jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.funnel_steps (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  position integer not null default 0,
  title text not null default 'Novo passo',
  step_type text not null default 'question' check (step_type in ('intro', 'question', 'break', 'form', 'landing', 'result')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (funnel_id, position)
);

create table if not exists public.step_blocks (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.funnel_steps(id) on delete cascade,
  position integer not null default 0,
  block_type text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (step_id, position)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  name text,
  email text,
  phone text,
  answers jsonb not null default '{}'::jsonb,
  source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  event_type text not null check (event_type in ('pageview', 'started', 'step_viewed', 'answer_submitted', 'lead_captured', 'completed')),
  step_id uuid references public.funnel_steps(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists funnel_steps_funnel_position_idx on public.funnel_steps(funnel_id, position);
create index if not exists step_blocks_step_position_idx on public.step_blocks(step_id, position);
create index if not exists funnel_events_funnel_created_idx on public.funnel_events(funnel_id, created_at desc);
create index if not exists leads_funnel_created_idx on public.leads(funnel_id, created_at desc);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.funnels enable row level security;
alter table public.funnel_steps enable row level security;
alter table public.step_blocks enable row level security;
alter table public.leads enable row level security;
alter table public.funnel_events enable row level security;

create schema if not exists private;

create or replace function private.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public, private as $$
  select exists (select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid());
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;

create policy "members can read workspaces" on public.workspaces for select to authenticated using (private.is_workspace_member(id));
create policy "users can create workspaces" on public.workspaces for insert with check (created_by = auth.uid());
create policy "members can read memberships" on public.workspace_members for select to authenticated using (user_id = auth.uid() or private.is_workspace_member(workspace_id));
create policy "members can manage funnels" on public.funnels for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "members can manage steps" on public.funnel_steps for all to authenticated using (exists (select 1 from public.funnels where id = funnel_id and private.is_workspace_member(workspace_id))) with check (exists (select 1 from public.funnels where id = funnel_id and private.is_workspace_member(workspace_id)));
create policy "members can manage blocks" on public.step_blocks for all to authenticated using (exists (select 1 from public.funnel_steps s join public.funnels f on f.id = s.funnel_id where s.id = step_id and private.is_workspace_member(f.workspace_id))) with check (exists (select 1 from public.funnel_steps s join public.funnels f on f.id = s.funnel_id where s.id = step_id and private.is_workspace_member(f.workspace_id)));
create policy "public can create leads" on public.leads for insert with check (exists (select 1 from public.funnels where id = funnel_id and status = 'published'));
create policy "members can read leads" on public.leads for select to authenticated using (private.is_workspace_member((select workspace_id from public.funnels where id = funnel_id)));
create policy "public can create events" on public.funnel_events for insert with check (exists (select 1 from public.funnels where id = funnel_id and status = 'published'));
create policy "members can read events" on public.funnel_events for select to authenticated using (private.is_workspace_member((select workspace_id from public.funnels where id = funnel_id)));
