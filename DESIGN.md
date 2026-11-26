# Kaos · identidad visual de Kaoticode

Komunly, LaKancha, Kallate, Klickum, Infoodmación, Kompetencia, Kostumbres, Lakarta,
Kaoticlub y Respetao son una sola familia: **todo igual, menos el acento**.

El archivo común es
`src/shared/kaos/kaos.css` (v2): se copia tal cual en cada web y
cada una solo fija su color.

## Lo que comparten todas

| | |
|---|---|
| Titulares | **Unbounded** 700, tracking −0.03em, solo en títulos de página y de sección (clase `.k-display`) |
| Interfaz y lectura | **Inter** (400–800) |
| Fondo y grises | los de la app de Komunly (`--k-bg` #07080a, `--k-surface` #0f1113, `--k-surface-raised` #16191c…) |
| Esquinas | tarjetas 20 px · campos 14 px · botones y chips en píldora · detalles 10 px |
| Iconos | lucide, trazo 2 |
| Estados | `--k-danger` #f0524a · `--k-success` #3dd68c · `--k-warning` #f2b84b |
| Tema | oscuro en todas (también Lakarta) |
| Firma | logo en baldosa con la inicial + nombre + «de Kaoticode» |

## Lo propio de cada producto: el acento

| Producto | `--k-accent` | Segundo color (detalles) |
|---|---|---|
| Komunly | `#a3e635` | — |
| LaKancha | `#00c048` | — |
| Kallate | `#fd7316` | `#ffbb2b` |
| Klickum | `#90c030` | `#184848` |
| Infoodmación | `#f09018` | `#d81860` |
| Kompetencia | `#d81818` | — |
| Kostumbres | `#34d399` | — |
| Lakarta | `#e0482b` | `#f6f0e4` |
| Kaoticlub | `#e61f5c` | `#42abe1` |
| Respetao | `#f0c040` | — |

El acento se usa en el botón principal, el elemento activo y los estados de selección; nunca
como decoración ni en grandes superficies.

## Portada común

Todas las portadas son **de cartel** (`k-hero k-hero--cover`): una foto a todo el ancho
(`k-hero__bg`), un velo oscuro teñido con el acento, grano de película y el texto encima,
abajo a la izquierda. En webs con barra lateral se añade `k-hero--inset` (tarjeta con
esquinas). La estructura del texto es la misma en todas:

1. `k-hero__endorse`: baldosa con la inicial + «Producto · de Kaoticode».
2. `k-hero__title`: titular en Unbounded; la palabra clave va en `<em>` (sale con el acento).
3. `k-hero__lead`: una o dos frases.
4. `k-hero__actions`: `k-btn` (principal) y `k-btn k-btn--ghost` (secundaria).
5. `k-hero__meta`: datos cortos, cada uno en su `<span>`.
6. `k-hero__bg`: la foto de fondo del producto (propia o de Unsplash, con su licencia).

El resplandor del acento arriba a la izquierda es la firma de la casa: no se quita.

## Animaciones

Solo CSS (`kaos.css` v5), repartidas por la página como en Kaoticlub, no amontonadas en la
portada. Todas mueven `transform`/`opacity` y se apagan con `prefers-reduced-motion`.

- **Portada** (una vez, al cargar): entrada escalonada de firma, titular, texto y botones;
  zoom de la foto; un brillo en la palabra destacada. Con scroll, la foto baja más despacio
  y el texto se despide. No hay animaciones sin fin en la portada.
- **Cintas cruzadas** (`k-marquee`), justo debajo de la portada: dos bandas de palabras del
  producto (acento y blanca) que se mueven solas y, con scroll, se desplazan cada una hacia
  un lado.
- **Aparición con scroll** (`k-reveal`): los títulos de sección suben al entrar en pantalla.
  En las webs con `k-headings`, todos los h2 de `<main>` lo hacen solos.
- **Botones**: se elevan y les cruza un destello al pasar el ratón.

## Menú inferior (KaosDock)

En el móvil todas las webs llevan el mismo menú abajo: `KaosDock.tsx`, copiado tal cual
junto a `kaos.css` (estilos `k-dock*`).

- Cuatro secciones como mucho, cada icono **siempre con su nombre** debajo.
- **«Más»** abre de un toque un panel con el resto (también se puede arrastrar hacia
  arriba). Se cierra con «Cerrar», tocando fuera, con Escape o al cambiar de página.
- La sección activa va en el acento de la marca, con una píldora suave detrás del icono.
- Cada web le pasa sus rutas, su enlace (`next/link` o un adaptador de react-router) y sus
  extras: `top` (el reproductor de Kallate), `badge` (el carrito), `panelStart`/`panelEnd`
  (publicar, cerrar sesión con `KaosDockAction`).
- **«Hazte premium» manda**: se marca con `highlight` y va la primera del panel, en el acento.
- Si la web tiene barra superior, **carrito y entrar van arriba a la derecha**, uno junto al
  otro, y no se repiten en el menú de abajo.
- `reserveSpace` deja hueco al final de la página para que el menú no tape nada.

## Marca y barra superior (KaosBrand, KaosTopBar)

La marca es siempre la misma pieza, en todas las webs: **el icono de la app** (cuadrado con
esquinas redondeadas, el mismo del PWA) **y el nombre en Unbounded**. Cada web la define en
su `brand.ts`, junto a `kaos.css`, y la usa en:

- la barra de arriba (`KaosBrand` a la izquierda);
- la primera fila del panel «Más» del menú de abajo (`brand` en `KaosDock`);
- el menú lateral de escritorio, donde lo haya.

A la derecha de la barra van, uno junto al otro, **carrito y entrar** con el botón redondo
común (`KaosTopAction`, con número si hace falta). Con sesión, en lugar de entrar va **la
cuenta: solo la foto** (o la inicial), redonda y del mismo tamaño (`KaosTopAccount`, o
`KaosAvatar` dentro de un menú con la clase `k-topbar__account`). Nunca el nombre al lado.
Como la cuenta está arriba, no se repite en el menú de abajo.

En el móvil la barra es siempre plana, pegada arriba y de 60 px: nada de píldoras flotantes. Las webs sin cabecera propia usan
`KaosTopBar` entera.

## Avisos, vacíos y errores (KaosFeedback)

`KaosFeedback.tsx`, copiado tal cual junto a `kaos.css` (estilos `k-toast*`, `k-state*`):

- **Avisos** (`KaosToastCard`): arriba en el centro, con el icono del tipo (hecho, error,
  aviso, atención), el texto y un fondo que se vacía mientras dura. Cada web lo usa desde su
  `toastMessage`, que mantiene su forma de llamarlo.
- **Vacío** (`KaosEmpty`, «No hay resultados»): icono con halo, etiqueta pequeña, el mensaje
  y, si hace falta, una acción. Desde `MessageInfo` / `EmptyState`.
- **Error de la API** (`KaosError`): deduce el tipo (sin conexión, sin acceso, no encontrado…),
  enseña lo que dijo el servidor y siempre da salida: **Reintentar** y **Volver**. Desde
  `ErrorMessage`.

## Avisos push (KaosPush)

Al iniciar sesión, todas las webs piden los avisos con la misma tarjeta (`KaosPush.tsx`,
estilos `k-push*`), encima del menú de abajo: «¿Te avisamos?» con **Activar** y una X
(«Ahora no», se respeta 3 días). El permiso se pide al tocar, nunca solo al entrar.

- Ya aceptados: se enlaza el dispositivo a la cuenta en silencio, una vez por visita.
- Bloqueados: no se insiste.
- iPhone/iPad fuera de la app instalada: explica «Compartir → Añadir a pantalla de inicio»
  (cada dos semanas como mucho), porque Safari solo da avisos ahí.
- La suscripción la guarda el servidor de la web **con el token** (`save`): Komunly enlaza
  el aviso a la cuenta solo por el token. La clave pública sale de `GET /push/public-key`.
- Las webs sin service worker copian `templates/sw.js` a `public/sw.js` (cambiando
  `APP_NAME`): muestra el aviso y al tocarlo abre esa página de la misma web.

## Tokens de shadcn

`kaos.css` redefine con `:root:root` los tokens de shadcn (`--background`, `--primary`,
`--card`…) a partir de los de Kaos, así cualquier componente de shadcn sale ya en la familia.

## Reglas

- Una web nueva empieza importando `kaos.css`, nunca desde la plantilla en blanco de shadcn.
- Nada de colores sueltos en los componentes: siempre `var(--k-*)`.
- Los textos que escribe la gente (posts, encuestas, comentarios) no van en Unbounded.
- Propuesta visual completa: https://claude.ai/artifact/DPJ3yBTs5zvxXUBQTrcqDw
