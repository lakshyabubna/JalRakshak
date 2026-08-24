create table if not exists public.registered_residents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 10 and 20),
  village_name text not null check (char_length(village_name) between 2 and 120),
  sms_consent boolean not null default false,
  consented_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (village_name, phone)
);

create index if not exists registered_residents_village_active_idx on public.registered_residents (village_name) where sms_consent and is_active;
alter table public.registered_residents enable row level security;
