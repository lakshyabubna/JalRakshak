create extension if not exists postgis;

create table if not exists public.health_reports (
  id uuid primary key default gen_random_uuid(),
  village_name text not null check (char_length(village_name) between 2 and 120),
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  reported_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.village_risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  village_name text not null,
  module text not null,
  community_health_score smallint not null check (community_health_score between 0 and 100),
  risk_score smallint not null check (risk_score between 0 and 100),
  risk_level text not null check (risk_level in ('safe', 'moderate', 'high', 'emergency')),
  drivers jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  village_name text not null,
  module text not null,
  severity text not null check (severity in ('moderate', 'high', 'emergency')),
  message text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists village_risk_snapshots_village_updated_idx on public.village_risk_snapshots (village_name, updated_at desc);
create index if not exists health_reports_village_reported_idx on public.health_reports (village_name, reported_at desc);

alter table public.health_reports enable row level security;
alter table public.village_risk_snapshots enable row level security;
alter table public.alerts enable row level security;
