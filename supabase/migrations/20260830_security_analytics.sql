-- Guest-accessible portfolio workspace. Enable Supabase Anonymous Sign-Ins before deploying.
create table if not exists public.security_alert_updates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  alert_id text not null,
  status text,
  assignee_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_incident_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  alert_id text not null,
  author text not null,
  body text not null check (char_length(body) <= 1000),
  created_at timestamptz not null default now()
);

create unique index if not exists security_alert_updates_owner_alert_key
  on public.security_alert_updates (owner_id, alert_id);

create table if not exists public.security_incident_actions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  alert_id text not null,
  action text not null check (action in ('contain')),
  created_at timestamptz not null default now()
);

alter table public.security_alert_updates enable row level security;
alter table public.security_incident_notes enable row level security;
alter table public.security_incident_actions enable row level security;

create policy "Guests manage their own alert updates" on public.security_alert_updates
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Guests manage their own notes" on public.security_incident_notes
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Guests manage their own actions" on public.security_incident_actions
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
