-- Ejecutar en Supabase SQL Editor DESPUÉS de las tablas base y de las políticas públicas iniciales.
-- No borra registros existentes. Deja los límites por configurar porque el estudio aún debe confirmar las cantidades reales.

alter table public.contract_packages
  alter column included_studio_dresses drop not null;

alter table public.booking_requests
  add column if not exists guardian_name text,
  add column if not exists payment_method text;

-- Cargar los nueve paquetes sin inventar precios, prestaciones ni cantidades de vestidos.
insert into public.contract_packages (name, description, active, included_photos, included_studio_dresses)
values
 ('Cuarzo Rosa', 'Paquete pendiente de completar por el estudio.', true, 0, null),
 ('Amatista', 'Paquete pendiente de completar por el estudio.', true, 0, null),
 ('Aguamarina', 'Paquete pendiente de completar por el estudio.', true, 0, null),
 ('Topacio', 'Paquete pendiente de completar por el estudio.', true, 0, null),
 ('Turmalina', 'Paquete pendiente de completar por el estudio.', true, 0, null),
 ('Esmeralda', 'Paquete pendiente de completar por el estudio.', true, 0, null),
 ('Zafiro', 'Paquete pendiente de completar por el estudio.', true, 0, null),
 ('Rubí', 'Paquete pendiente de completar por el estudio.', true, 0, null),
 ('Diamante', 'Paquete pendiente de completar por el estudio.', true, 0, null)
on conflict (name) do nothing;

-- Lectura pública limitada: solo paquetes activos y vestidos disponibles.
drop policy if exists "Public can view active packages" on public.contract_packages;
create policy "Public can view active packages"
  on public.contract_packages for select to anon, authenticated
  using (active = true);

drop policy if exists "Public can view available dresses" on public.dresses;
create policy "Public can view available dresses"
  on public.dresses for select to anon, authenticated
  using (status = 'available');

-- No se crean políticas públicas de INSERT/UPDATE/DELETE para solicitudes ni selecciones.
-- El backend las guarda usando una clave de servidor privada.
