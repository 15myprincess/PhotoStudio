-- My Princess v5: cuentas opcionales, fechas privadas y recordatorios por correo.
-- Ejecutar en Supabase SQL Editor. No elimina ni modifica reservas existentes.
create table if not exists public.client_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null,
  reminders_opt_in boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.client_profiles enable row level security;
drop policy if exists "Client can read own profile" on public.client_profiles;
create policy "Client can read own profile" on public.client_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Client can create own profile" on public.client_profiles;
create policy "Client can create own profile" on public.client_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Client can update own profile" on public.client_profiles;
create policy "Client can update own profile" on public.client_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.event_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  client_name text not null check (char_length(client_name) between 2 and 120),
  client_email text not null,
  event_date date not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  reminder_consent boolean not null default false,
  reminded_3d_at timestamptz,
  reminded_1d_at timestamptz,
  reminded_day_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists event_reservations_reminders_idx on public.event_reservations (event_date, status);
alter table public.event_reservations enable row level security;
drop policy if exists "Client sees own event reservation" on public.event_reservations;
create policy "Client sees own event reservation" on public.event_reservations for select to authenticated using (auth.uid() = user_id);
-- No public insert/update/delete policies. Confirmed reservations and reminder flags are written by trusted server/admin only.
