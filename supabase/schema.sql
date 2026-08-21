-- JalRakshak 2.0 core schema. Run in Supabase SQL Editor before enabling live data.
create extension if not exists "pgcrypto";

create table if not exists public.villages (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  district text not null, community_health_score smallint check (community_health_score between 0 and 100),
  risk_level text not null default 'safe' check (risk_level in ('safe','moderate','high','emergency')), created_at timestamptz not null default now()
);
create table if not exists public.health_scores (
  id uuid primary key default gen_random_uuid(), village_id uuid not null references public.villages(id) on delete cascade,
  module text not null, score smallint not null check (score between 0 and 100), risk_level text not null,
  explanation text, measured_at timestamptz not null default now()
);
create table if not exists public.disease_reports (
  id uuid primary key default gen_random_uuid(), village_id uuid references public.villages(id) on delete set null,
  report_type text not null, symptoms text[] default '{}', report_source text not null default 'citizen',
  status text not null default 'new', created_at timestamptz not null default now()
);
create table if not exists public.water_sources (
  id uuid primary key default gen_random_uuid(), village_id uuid not null references public.villages(id) on delete cascade,
  source_type text not null, location_label text not null, visual_status text not null, checked_at timestamptz not null default now()
);
create table if not exists public.vaccination_records (
  id uuid primary key default gen_random_uuid(), village_id uuid not null references public.villages(id) on delete cascade,
  coverage_percent smallint not null check (coverage_percent between 0 and 100), recorded_at timestamptz not null default now()
);
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(), village_id uuid references public.villages(id) on delete set null,
  module text not null, severity text not null check (severity in ('moderate','high','emergency')),
  message text not null, delivery_channel text, status text not null default 'queued', created_at timestamptz not null default now()
);

alter table public.villages enable row level security;
alter table public.health_scores enable row level security;
alter table public.disease_reports enable row level security;
alter table public.water_sources enable row level security;
alter table public.vaccination_records enable row level security;
alter table public.alerts enable row level security;

-- Replace these demo read policies with role-specific policies before production.
create policy "demo public read villages" on public.villages for select using (true);
create policy "demo public read scores" on public.health_scores for select using (true);
