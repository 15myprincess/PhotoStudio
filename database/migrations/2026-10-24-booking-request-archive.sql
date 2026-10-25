-- My Princess: soporte para archivar solicitudes denegadas.
-- Ejecuta este script una sola vez en Supabase > SQL Editor.
alter table public.booking_requests
  add column if not exists archived_at timestamptz null;

create index if not exists booking_requests_archived_at_idx
  on public.booking_requests (archived_at);

comment on column public.booking_requests.archived_at is
  'Fecha en que una solicitud denegada se archivó desde el panel administrativo. NULL significa que no está archivada.';
