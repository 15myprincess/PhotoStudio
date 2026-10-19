# 30 vestidos de muestra · My Princess

Imágenes ilustradas de referencia (`vestido-01.jpg` … `vestido-30.jpg`, 900 × 1200 px, formato vertical 3:4 como las tarjetas
de la galería). Cada una lleva su código `MUESTRA-XX` y la leyenda "reemplazar por la foto real".

## Cómo verlas en la galería
1. **Supabase → Storage → bucket `vestidos`** (debe ser público). Crea la carpeta `muestra` y sube las 30 imágenes de esta carpeta.
2. **Supabase → SQL Editor:** pega y ejecuta `sql/03_vestidos_muestra.sql`. Crea 30 vestidos con color, talla y estado "available".
3. Abre `vestuario.html` (elige antes un contrato en la página principal). Deben aparecer los 30, con filtro por color y buscador.

## Cómo reemplazarlas por tus fotos
- **Más fácil:** sube tu foto con **el mismo nombre** (`muestra/vestido-01.jpg`) sobrescribiendo la de muestra. No tocas la base de datos.
- **Recomendado a largo plazo:** sube tus fotos con su propia ruta (por ejemplo `reales/V-001.jpg`), crea cada vestido con su código, nombre,
  color y talla, y al terminar borra las muestras: `delete from public.dresses where code like 'MUESTRA-%';`
- Foto ideal: vertical 3:4 (900 × 1200 px), JPG, menos de ~150 KB para que cargue rápido.

## Lo que incluye
6 cortes (princesa, línea A, sirena, con vuelos, midi) × 6 escotes (corazón, tirantes, halter, mangas globo, hombros caídos, un solo hombro)
en 30 colores distintos: Blanco, Marfil, Champán, Rosa palo, Rosa claro, Fucsia, Rosa chicle, Coral, Durazno, Salmón, Rojo, Vino, Burdeos,
Dorado, Amarillo, Plateado, Gris perla, Negro, Azul marino, Azul rey, Celeste, Turquesa, Aqua, Verde menta, Verde esmeralda, Verde oliva,
Lila, Lavanda, Morado, Cobre.
