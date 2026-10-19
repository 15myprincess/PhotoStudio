-- My Princess — 30 vestidos de MUESTRA para la galería (vestuario.html)
-- Sirven solo de referencia: luego los reemplazas por tus vestidos reales.
--
-- ANTES de ejecutar: sube las imágenes de la carpeta vestidos-muestra/ al bucket PÚBLICO "vestidos",
-- dentro de una carpeta llamada "muestra" (ruta final: vestidos/muestra/vestido-01.jpg ... vestido-30.jpg).
--
-- Se puede ejecutar varias veces: primero borra las muestras anteriores (códigos MUESTRA-XX) y las vuelve a crear.
-- Si te da error por la columna "id" (sin valor por defecto), añade id a la lista de columnas y gen_random_uuid() a cada fila.

begin;

delete from public.dresses where code like 'MUESTRA-%';

insert into public.dresses (code, name, color, size, description, image_path, status) values
  ('MUESTRA-01', 'Vestido princesa blanco', 'Blanco', '4', 'Muestra: corte princesa, escote corazón. Reemplazar por la foto real.', 'muestra/vestido-01.jpg', 'available'),
  ('MUESTRA-02', 'Vestido línea A marfil', 'Marfil', '6', 'Muestra: corte línea A, un solo hombro. Reemplazar por la foto real.', 'muestra/vestido-02.jpg', 'available'),
  ('MUESTRA-03', 'Vestido sirena champán', 'Champán', '8', 'Muestra: corte sirena, hombros caídos. Reemplazar por la foto real.', 'muestra/vestido-03.jpg', 'available'),
  ('MUESTRA-04', 'Vestido con vuelos rosa palo', 'Rosa palo', '10', 'Muestra: corte con vuelos, mangas globo. Reemplazar por la foto real.', 'muestra/vestido-04.jpg', 'available'),
  ('MUESTRA-05', 'Vestido midi rosa claro', 'Rosa claro', '12', 'Muestra: corte midi, escote halter. Reemplazar por la foto real.', 'muestra/vestido-05.jpg', 'available'),
  ('MUESTRA-06', 'Vestido princesa fucsia', 'Fucsia', '14', 'Muestra: corte princesa, mangas globo. Reemplazar por la foto real.', 'muestra/vestido-06.jpg', 'available'),
  ('MUESTRA-07', 'Vestido princesa rosa chicle', 'Rosa chicle', '4', 'Muestra: corte princesa, con tirantes. Reemplazar por la foto real.', 'muestra/vestido-07.jpg', 'available'),
  ('MUESTRA-08', 'Vestido línea A coral', 'Coral', '6', 'Muestra: corte línea A, escote corazón. Reemplazar por la foto real.', 'muestra/vestido-08.jpg', 'available'),
  ('MUESTRA-09', 'Vestido sirena durazno', 'Durazno', '8', 'Muestra: corte sirena, un solo hombro. Reemplazar por la foto real.', 'muestra/vestido-09.jpg', 'available'),
  ('MUESTRA-10', 'Vestido con vuelos salmón', 'Salmón', '10', 'Muestra: corte con vuelos, hombros caídos. Reemplazar por la foto real.', 'muestra/vestido-10.jpg', 'available'),
  ('MUESTRA-11', 'Vestido midi rojo', 'Rojo', '12', 'Muestra: corte midi, mangas globo. Reemplazar por la foto real.', 'muestra/vestido-11.jpg', 'available'),
  ('MUESTRA-12', 'Vestido princesa vino', 'Vino', '14', 'Muestra: corte princesa, escote halter. Reemplazar por la foto real.', 'muestra/vestido-12.jpg', 'available'),
  ('MUESTRA-13', 'Vestido princesa burdeos', 'Burdeos', '4', 'Muestra: corte princesa, escote halter. Reemplazar por la foto real.', 'muestra/vestido-13.jpg', 'available'),
  ('MUESTRA-14', 'Vestido línea A dorado', 'Dorado', '6', 'Muestra: corte línea A, con tirantes. Reemplazar por la foto real.', 'muestra/vestido-14.jpg', 'available'),
  ('MUESTRA-15', 'Vestido sirena amarillo', 'Amarillo', '8', 'Muestra: corte sirena, escote corazón. Reemplazar por la foto real.', 'muestra/vestido-15.jpg', 'available'),
  ('MUESTRA-16', 'Vestido con vuelos plateado', 'Plateado', '10', 'Muestra: corte con vuelos, un solo hombro. Reemplazar por la foto real.', 'muestra/vestido-16.jpg', 'available'),
  ('MUESTRA-17', 'Vestido midi gris perla', 'Gris perla', '12', 'Muestra: corte midi, hombros caídos. Reemplazar por la foto real.', 'muestra/vestido-17.jpg', 'available'),
  ('MUESTRA-18', 'Vestido princesa negro', 'Negro', '14', 'Muestra: corte princesa, mangas globo. Reemplazar por la foto real.', 'muestra/vestido-18.jpg', 'available'),
  ('MUESTRA-19', 'Vestido princesa azul marino', 'Azul marino', '4', 'Muestra: corte princesa, mangas globo. Reemplazar por la foto real.', 'muestra/vestido-19.jpg', 'available'),
  ('MUESTRA-20', 'Vestido línea A azul rey', 'Azul rey', '6', 'Muestra: corte línea A, escote halter. Reemplazar por la foto real.', 'muestra/vestido-20.jpg', 'available'),
  ('MUESTRA-21', 'Vestido sirena celeste', 'Celeste', '8', 'Muestra: corte sirena, con tirantes. Reemplazar por la foto real.', 'muestra/vestido-21.jpg', 'available'),
  ('MUESTRA-22', 'Vestido con vuelos turquesa', 'Turquesa', '10', 'Muestra: corte con vuelos, escote corazón. Reemplazar por la foto real.', 'muestra/vestido-22.jpg', 'available'),
  ('MUESTRA-23', 'Vestido midi aqua', 'Aqua', '12', 'Muestra: corte midi, un solo hombro. Reemplazar por la foto real.', 'muestra/vestido-23.jpg', 'available'),
  ('MUESTRA-24', 'Vestido princesa verde menta', 'Verde menta', '14', 'Muestra: corte princesa, hombros caídos. Reemplazar por la foto real.', 'muestra/vestido-24.jpg', 'available'),
  ('MUESTRA-25', 'Vestido princesa verde esmeralda', 'Verde esmeralda', '4', 'Muestra: corte princesa, hombros caídos. Reemplazar por la foto real.', 'muestra/vestido-25.jpg', 'available'),
  ('MUESTRA-26', 'Vestido línea A verde oliva', 'Verde oliva', '6', 'Muestra: corte línea A, mangas globo. Reemplazar por la foto real.', 'muestra/vestido-26.jpg', 'available'),
  ('MUESTRA-27', 'Vestido sirena lila', 'Lila', '8', 'Muestra: corte sirena, escote halter. Reemplazar por la foto real.', 'muestra/vestido-27.jpg', 'available'),
  ('MUESTRA-28', 'Vestido con vuelos lavanda', 'Lavanda', '10', 'Muestra: corte con vuelos, con tirantes. Reemplazar por la foto real.', 'muestra/vestido-28.jpg', 'available'),
  ('MUESTRA-29', 'Vestido midi morado', 'Morado', '12', 'Muestra: corte midi, escote corazón. Reemplazar por la foto real.', 'muestra/vestido-29.jpg', 'available'),
  ('MUESTRA-30', 'Vestido princesa cobre', 'Cobre', '14', 'Muestra: corte princesa, mangas globo. Reemplazar por la foto real.', 'muestra/vestido-30.jpg', 'available');

commit;

-- ═══ CUANDO YA TENGAS TUS VESTIDOS REALES: borra todas las muestras con esto ═══
-- delete from public.dresses where code like 'MUESTRA-%';
