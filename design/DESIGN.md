# DESIGN.md — Sistema de diseño de carlitos-co-admin

Fuente de verdad para todo lo visual del front. Si un color, tamaño o sombra no está aquí, no se usa.
El front lo traduce en un solo archivo: `web/src/assets/styles/_tokens.scss` (ver [Mapeo a Bootstrap](#mapeo-a-bootstrap)).

## Referencias

> **Vista previa viva:** [`system.html`](system.html) muestra todos los tokens y componentes de este documento con Bootstrap real. Sus estilos están en [`system/`](system/): `_tokens.scss` y `_components.scss` son los que pasan tal cual al front; `_docs.scss` es solo de la página de muestra. Si algo de este documento cambia, se cambia también ahí y se recompila (comando en [`system/system.scss`](system/system.scss)).

| Archivo | Qué es | Para qué se usa |
| --- | --- | --- |
| [`color_palette.jpeg`](color_palette.jpeg) | Paleta oficial de Carlitos (5 colores) | Base de todos los colores de marca |
| [`logo.jpg`](logo.jpg) | Logo "Carlitosco Importaciones" | Sidebar, login, portada de PDFs |
| [`dashboard_design.mp4`](dashboard_design.mp4) | Referencia de layout (CRM "Brisk") | Estructura: sidebar, topbar, toolbar, gráfico + tabla, panel lateral |

Del video se toma **la estructura y el tono** (superficies blancas planas, bordes de 1px, sombras mínimas, grises fríos, CTA oscuro). No se copian su marca, iconos ni textos.

## Principios

1. **Plano y con bordes.** Las secciones se separan con bordes de 1px, no con sombras grandes. La sombra es solo para lo que flota (dropdowns, modales, toasts).
2. **El navy manda, el dorado acompaña.** `primary` (navy) para acciones y estado activo; el dorado es acento puntual, nunca color de texto sobre blanco.
3. **Grises fríos.** Toda la escala neutra tiene un tinte azul leve (hue 250) para casar con el navy.
4. **Densidad de herramienta.** Texto base de 14px, controles de 36px. Es un panel de trabajo, no una landing.
5. **Color nunca solo.** Estados y series siempre llevan además un ícono, texto o etiqueta.

## Color

### Marca (de `color_palette.jpeg`)

| Token | Hex | Rol | Contraste vs blanco |
| --- | --- | --- | --- |
| `brand-navy` | `#195073` | `primary`: CTA, nav activo, links, foco | 8.6:1 ✅ |
| `brand-steel` | `#377BA6` | `secondary` / `info` | 4.6:1 ✅ (AA justo) |
| `brand-gold` | `#BF9969` | Detalles y logo (ya no es el botón acento) | 2.6:1 ❌ → texto oscuro encima |
| `brand-sand` | `#BFB49F` | Relleno del botón acento y decoración (fondos suaves, ilustraciones) | 2.1:1 ❌ → nunca como texto; el texto sobre él va en `gray-900` |
| `brand-mist` | `#F2F2F2` | Fondo de la app y rellenos sutiles | — |

Estados derivados del navy (para `:hover` y `:active` de lo primario):

| Token | Hex |
| --- | --- |
| `primary-hover` | `#0E4161` |
| `primary-active` | `#063653` |

### Neutros (grises fríos)

| Token | Hex | Uso |
| --- | --- | --- |
| `gray-50` | `#F9FAFC` | Hover de filas y botones neutros |
| `gray-100` | `#F0F4F7` | Header de tabla, nav item activo |
| `gray-200` | `#E1E7ED` | **Borde por defecto**, grid de gráficos |
| `gray-300` | `#CDD5DE` | Borde de inputs y botones neutros |
| `gray-400` | `#9BA6B2` | Placeholders, íconos inactivos (no texto informativo) |
| `gray-500` | `#677583` | Texto terciario (4.7:1 sobre blanco; **no** sobre `brand-mist`) |
| `gray-600` | `#4C5A69` | Texto secundario (6.3:1 incluso sobre `brand-mist`) |
| `gray-700` | `#364452` | Íconos activos |
| `gray-800` | `#222C38` | **Texto del cuerpo** |
| `gray-900` | `#141B24` | Títulos, cifras de KPIs |

### Estados

Armonizados con la paleta: mismo nivel de luminosidad y saturación contenida, sin verdes ni rojos chillones.

| Token | Hex | Texto encima | Contraste vs blanco | Uso |
| --- | --- | --- | --- | --- |
| `success` | `#307E4B` | blanco | 5.0:1 ✅ | Guardado, pagada, stock OK |
| `danger` | `#B43E37` | blanco | 5.7:1 ✅ | Eliminar, error, vencida |
| `warning` | `#DA9E3F` | `gray-900` | 2.4:1 → texto oscuro | Stock bajo, saldo pendiente |
| `info` | `#377BA6` | blanco | 4.6:1 ✅ | Avisos neutros |

Fondos y bordes "subtle" (alerts, badges suaves) los genera Bootstrap desde estos valores. No se definen a mano.

### Superficies y texto

| Token | Valor | Uso |
| --- | --- | --- |
| `surface` | `#FFFFFF` | Sidebar, topbar, tarjetas, tablas, modales |
| `surface-subtle` | `brand-mist` `#F2F2F2` | Fondo general detrás del contenido, login |
| `border` | `gray-200` | Divisores, tarjetas, tablas |
| `border-strong` | `gray-300` | Inputs, botones neutros |
| `text` | `gray-800` | Cuerpo |
| `text-strong` | `gray-900` | Títulos |
| `text-secondary` | `gray-600` | Labels, subtítulos |
| `text-tertiary` | `gray-500` | Metadatos sobre `surface` |

### Gráficos

Los colores de marca tienen poca saturación (OKLCH C < 0.10) y como series se leen grises, sobre todo para personas con daltonismo. Por eso los gráficos usan **pasos de los mismos tonos de marca** con algo más de croma. Se validaron con el script del skill `dataviz` (OKLab ΔE×100, simulación Machado 2009) contra fondo `#FFFFFF`.

**Categórica**: orden fijo, nunca ciclado. Una serie siempre tiene el mismo color aunque cambien los filtros.

| Slot | Tono | Hex |
| --- | --- | --- |
| `chart-1` | navy | `#005B8A` |
| `chart-2` | dorado | `#BF873A` |
| `chart-3` | steel | `#3691BA` |
| `chart-4` | bronce | `#9A5929` |
| `chart-5` | teal | `#2B9477` |
| `chart-6` | lila | `#7E65A9` |

Resultado: banda de luminosidad ✅, croma ≥ 0.10 ✅, separación CVD entre adyacentes ΔE 10.1 ✅ (meta ≥ 8), visión normal ΔE 19.1 ✅ (piso 15), contraste ≥ 3:1 ✅.
Para dispersión o gráficos de pastel, donde todos los colores se comparan con todos, se usan **máximo los 3 primeros** (validados all-pairs con ΔE 17.1). De la serie 7 en adelante todo se agrupa en "Otros" con `gray-400`.

**Secuencial** (magnitud, un solo tono navy, claro → oscuro), validada como rampa ordinal:

`#86B8DD` → `#5D99C4` → `#3A7BA7` → `#1F5E85` → `#0E4161`

**Divergente** (ej. variación vs mes anterior): `chart-4` bronce `#9A5929` ← `gray-300` `#CDD5DE` → `chart-1` navy `#005B8A`.

Los colores de estado (`success`, `danger`, …) **no se usan como series**.

## Tipografía

La fuente se define después. Todo el front referencia **una sola variable global**, `$cc-font-sans`. Mientras tanto se usa el stack del sistema. Cambiar la fuente es editar esa línea (y agregar el `@import` o el paquete de la fuente).

| Token | Tamaño | Peso | Uso |
| --- | --- | --- | --- |
| `text-xs` | 12px / 0.75rem | 400–500 | Ejes, leyendas, metadatos, badges |
| `text-sm` | 13px / 0.8125rem | 400 | Celdas de tabla densas, ayudas de formulario |
| `text-base` | **14px / 0.875rem** | 400 | Cuerpo, inputs, botones (500) |
| `text-md` | 16px / 1rem | 600 | Título de tarjeta o sección ("Calculated Value" en el video) |
| `text-lg` | 20px / 1.25rem | 600 | Título de página en el topbar |
| `text-xl` | 28px / 1.75rem | 600 | Cifra principal de un KPI |

- Interlineado: 1.5 en el cuerpo, 1.25 en títulos.
- Pesos permitidos: 400, 500, 600. Nada de 700+ salvo el logo.
- Las cifras de tablas y KPIs llevan `font-variant-numeric: tabular-nums` para que las columnas alineen.

## Espaciado, radios, sombras

**Espaciado:** escala de Bootstrap sin cambios (`$spacer: 1rem`): `1`=4px, `2`=8px, `3`=16px, `4`=24px, `5`=48px. Más el token propio `space-5` = 20px (`--cc-space-5`) para el padding de secciones grandes.

| Token | Valor | Uso |
| --- | --- | --- |
| `radius-sm` | 6px | Badges, checkboxes, ítems del sidebar |
| `radius` | 8px | Botones, inputs, selects, dropdowns |
| `radius-lg` | 12px | Tarjetas, tablas con borde, modales |
| `radius-pill` | 999px | Puntos de leyenda, avatares, barra de progreso |

| Token | Valor | Uso |
| --- | --- | --- |
| `shadow-xs` | `0 1px 2px rgba(20,27,36,.06)` | Botones neutros, inputs (el "relieve" sutil del video) |
| `shadow-sm` | `0 1px 3px rgba(20,27,36,.08), 0 1px 2px rgba(20,27,36,.04)` | Tarjetas al hacer hover |
| `shadow-md` | `0 8px 24px rgba(20,27,36,.10)` | Dropdowns, popovers, toasts |
| `shadow-lg` | `0 16px 48px rgba(20,27,36,.16)` | Modales |
| `focus-ring` | `0 0 0 3px rgba(25,80,115,.18)` + borde `primary` | Foco de inputs y selects (el borde navy da el contraste) |

Botones, links, ítems del nav y checkboxes no tienen borde que lo acompañe, así que su foco de teclado es un `outline` de 2px `primary` con offset de 2px: el anillo de .18 solo no se ve sobre blanco.

## Layout (de `dashboard_design.mp4`)

```text
┌──────────────┬───────────────────────────────────────────────┐
│ Logo + marca │ Título de página        [🔔] [Buscar…] [acción]│ ← topbar 64px
│──────────────├───────────────────────────────────────────────┤
│ Nav principal│ Toolbar: filtros / orden       [Exportar ▾]    │ ← toolbar 64px
│  · Dashboard │───────────────────────────────┬───────────────┤
│  · Productos │ Contenido (gráfico, tabla)    │ Panel lateral │
│  · Clientes  │                               │ (formulario / │
│  …           │                               │  filtros)     │
│──────────────│                               │  360px        │
│ Ajustes      │                               │               │
│ Usuario  ⏏   │                               │               │
└──────────────┴───────────────────────────────┴───────────────┘
   260px
```

| Token | Valor |
| --- | --- |
| `sidebar-width` | 260px (colapsado: 72px, solo íconos) |
| `topbar-height` | 64px |
| `toolbar-height` | 64px |
| `side-panel-width` | 360px |
| `content-padding` | 24px (`p-4`) |
| `control-height` | 36px (botones, inputs de toolbar) · 44px (inputs de formulario en panel) |
| `nav-item-height` | 40px |
| `table-row-height` | 44px |

- Breakpoint: debajo de `lg` (992px) el sidebar pasa a `offcanvas`.
- **Panel lateral, dos variantes.** El diagrama de arriba es la del video: un panel de 360px al lado del contenido (`.cc-sidepanel`), que angosta la tabla al abrirse. La app usa la variante **overlay** (`.cc-sidepanel--overlay` + `.cc-sidepanel-backdrop`): el mismo panel, pero `position: fixed` pegado a la derecha y de borde a borde en vertical, sobre un velo como el de los modales. No ocupa lugar en el layout, así la tabla no se aprieta ni aparece scroll horizontal. En pantallas de menos de 360px ocupa todo el ancho.
- Fondo: `surface` para sidebar, topbar y paneles; `surface-subtle` solo detrás de cuadrículas de tarjetas (dashboard) y en el login.

## Componentes

Cada uno con su equivalente en Bootstrap. "SCSS propio" significa que va en `web/src/assets/styles/_components.scss` y usa solo tokens.

| Componente | Base Bootstrap | Especificación |
| --- | --- | --- |
| **AppSidebar** | `nav flex-column`, `collapse`, `offcanvas` (móvil) | Logo 40px con `radius-sm` + nombre (`text-base` 600) y subtítulo (`text-xs`, `gray-500`). Ítems de 40px, ícono 18px `gray-700`, texto `gray-800`. Hover `gray-50`; activo `gray-100` + texto `gray-900` 500. Grupos separados con borde `border`. Subítems con línea guía punteada `gray-300` a la izquierda (SCSS propio). Usuario y sign-out al fondo. |
| **AppTopbar** | `d-flex` + `form-control` | Título `text-lg`. A la derecha: botón ícono (36×36, neutro), buscador con ícono (ancho 240px) y acción principal. Borde inferior `border`. |
| **Botón primario** | `btn-primary` | Navy, texto blanco 500, `radius`, 36px. Una sola acción primaria por vista (Guardar, Nuevo, Exportar). |
| **Botón neutro** | `.btn-neutral` (SCSS propio con el mixin `button-variant`) | Fondo blanco, borde `gray-300`, texto `gray-800`, `shadow-xs`; hover `gray-50`. Es el botón más común (Filtrar, Ordenar, Descartar, Descargar). |
| **Botón acento** | `.btn-accent` (SCSS propio) | Sand `brand-sand`, texto `gray-900` (~8:1). Hover `#B2A68E`, active `#A59A82`. Uso excepcional (máximo uno por pantalla, ej. "Generar reporte PDF"). |
| **Botón peligro** | `btn-danger` / `btn-outline-danger` | Solo para eliminar; siempre abre `ConfirmDialog`. |
| **Split button** | `btn-group` + `dropdown-toggle-split` | Como "Exports ▾" del video. Divisor interno de 1px. |
| **Inputs / selects** | `form-control`, `form-select`, `form-check` | Borde `gray-300`, `radius`, `shadow-xs`, placeholder `gray-400`. Foco: borde `primary` + `focus-ring`. Label `text-sm` 500 `gray-600` arriba. Error: borde `danger` + mensaje `text-xs`. |
| **KpiCard** | `card` | `radius-lg`, borde `border`, sin sombra. Label `text-sm` `gray-600`, cifra `text-xl` `gray-900` tabular, variación con ícono ▲▼ + color de estado. |
| **ChartCard** | `card` | Header: título `text-md` + botón neutro "Descargar ▾" a la derecha. Leyenda debajo del título: punto de 8px `radius-pill` + `text-xs` `gray-600`. |
| **DataTable** | `table` dentro de `card` | Header `gray-100`, `text-xs` 500 `gray-600`. Filas de 44px, divisor `border`, hover `gray-50`. Sin rayado (`table-striped` no). Números alineados a la derecha. |
| **Badge de estado** | `badge` + `bg-*-subtle text-*-emphasis` | `radius-sm`, `text-xs` 500, siempre con ícono o texto claro ("Pagada", "Vencida"). |
| **Progress** | `progress` | Alto 6px, `radius-pill`, fondo `gray-200`. |
| **ConfirmDialog / modales** | `modal` | `radius-lg`, `shadow-lg`, header sin borde. |
| **SidePanel (overlay)** | `offcanvas` (solo el z-index y el velo) | SCSS propio. 360px (`side-panel-width`), `surface`, borde izquierdo `border`, `shadow-lg` porque flota, padding 20px. Encabezado con título `text-md` 600 y botón ícono neutro para cerrar. Los botones de acción quedan pegados abajo (`.cc-form-actions`). Entra deslizándose desde la derecha (200ms; sin animar con `prefers-reduced-motion`); la salida es instantánea. Es un diálogo modal: `role="dialog"` + `aria-modal`, el foco va al primer campo y vuelve al botón de origen, Tab no sale del panel. Se cierra con la X, "Cancelar" o Esc; **un clic en el velo no lo cierra**, para no perder lo escrito. |
| **ToastHost** | `toast` | `shadow-md`, ícono de estado a la izquierda. |
| **EmptyState** | — | Ícono 32px `gray-400`, título `text-md`, texto `gray-500`, botón primario opcional. |

### Gráficos (Chart.js)

- Barras: `borderRadius: 4` en el extremo de datos, `maxBarThickness: 24`, y separación de 2px entre segmentos apilados (`borderWidth: 2`, `borderColor: surface`).
- Líneas: 2px, puntos solo al hacer hover (radio 4).
- Grid horizontal `gray-200`, sin grid vertical. Ejes y ticks `text-xs` `gray-500`.
- Tooltip: fondo `gray-900`, texto blanco, `radius`; muestra serie + valor formateado.
- Leyenda HTML propia (la del `ChartCard`), no la de canvas de Chart.js.
- Con 4 series o menos, además de la leyenda llevan etiqueta directa. Cada reporte tiene su tabla (requisito del PDF), así que el color nunca es la única forma de leer el dato.
- Los colores salen de las variables CSS `--cc-chart-*` (se leen con `getComputedStyle`), no se escriben en hex dentro de los componentes.

## Iconografía

Íconos de línea, 18px en nav y botones, trazo de 1.5px, color `currentColor`. **Pendiente** elegir la librería (ver abajo).

## Mapeo a Bootstrap

`web/src/assets/styles/_tokens.scss`: es lo único que hay que tocar para cambiar el diseño. Se importa **antes** de `bootstrap/scss/bootstrap`, así las variables de Bootstrap (que usan `!default`) toman estos valores.

```scss
// _tokens.scss — traduce design/DESIGN.md a Bootstrap 5.3.
// Va ANTES de @import "bootstrap/scss/bootstrap" para que los !default de Bootstrap tomen estos valores.

// ---------- Tipografía (fuente por decidir: cambiar SOLO esta línea) ----------
$cc-font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

// ---------- Marca ----------
$cc-navy:  #195073;
$cc-steel: #377BA6;
$cc-gold:  #BF9969;
$cc-sand:  #BFB49F;
$cc-mist:  #F2F2F2;

// ---------- Neutros fríos ----------
$white:    #FFFFFF;
$gray-100: #F0F4F7;
$gray-200: #E1E7ED;
$gray-300: #CDD5DE;
$gray-400: #9BA6B2;
$gray-500: #677583;
$gray-600: #4C5A69;
$gray-700: #364452;
$gray-800: #222C38;
$gray-900: #141B24;
$black:    #141B24;

// ---------- Theme colors ----------
// "accent" NO se agrega a $theme-colors: en 5.3 alerts/list-group esperan sus mapas *-text-emphasis
// y quedarían rotos. El acento vive como .btn-accent en _components.scss.
$primary:   $cc-navy;
$secondary: $cc-steel;
$success:   #307E4B;
$info:      $cc-steel;
$warning:   #DA9E3F;
$danger:    #B43E37;
$light:     $cc-mist;
$dark:      $gray-900;

// Bootstrap elige texto claro u oscuro sobre cada color con este umbral (WCAG AA).
$min-contrast-ratio:   4.5;
$color-contrast-dark:  $gray-900;
$color-contrast-light: $white;

// ---------- Cuerpo y texto ----------
$body-bg:             $white;
$body-color:          $gray-800;
$body-secondary-color: $gray-600;
$body-tertiary-color: $gray-500;
$headings-color:      $gray-900;
$headings-font-weight: 600;
$link-color:          $primary;
$link-decoration:     none;

$font-family-sans-serif: $cc-font-sans;
$font-size-base: .875rem;   // 14px
$font-size-sm:   .75rem;    // 12px
$font-size-lg:   1rem;      // 16px
$h1-font-size: 1.75rem;     // 28px
$h2-font-size: 1.25rem;     // 20px
$h3-font-size: 1rem;        // 16px
$h4-font-size: .875rem;
$h5-font-size: .875rem;
$h6-font-size: .75rem;
$line-height-base: 1.5;
$headings-line-height: 1.25;

// ---------- Bordes, radios, sombras ----------
$border-color:     $gray-200;
$border-radius-sm: 6px;
$border-radius:    8px;
$border-radius-lg: 12px;
$border-radius-pill: 999px;

$box-shadow-sm: 0 1px 2px rgba($gray-900, .06);
$box-shadow:    0 8px 24px rgba($gray-900, .10);
$box-shadow-lg: 0 16px 48px rgba($gray-900, .16);

// Foco: anillo suave navy en vez del glow azul por defecto (lo que más delata a Bootstrap).
$focus-ring-width:   3px;
$focus-ring-opacity: .18;
$focus-ring-color:   rgba($primary, .18);
$input-btn-focus-width:      3px;
$input-btn-focus-color:      rgba($primary, .18);
$input-btn-focus-box-shadow: 0 0 0 3px rgba($primary, .18);

// ---------- Botones e inputs (36px de alto con texto de 14px) ----------
// 6.5px * 2 + 21px (14px * 1.5) + 2px de borde = 36px
$input-btn-padding-y: .40625rem;
$input-btn-padding-x: .875rem;
$input-btn-padding-y-sm: .25rem;
$input-btn-padding-x-sm: .625rem;
// "lg" = control de formulario de 44px (panel lateral), con el mismo texto de 14px
$input-btn-padding-y-lg: .65625rem;
$input-btn-padding-x-lg: 1rem;
$input-btn-font-size-lg: $font-size-base;
$btn-font-weight: 500;
$input-border-color: $gray-300;
$input-focus-border-color: $primary;
$input-placeholder-color: $gray-400;
// $enable-shadows queda apagado: la sombra xs de inputs y botones neutros va en _components.scss
$form-label-font-weight: 500;
$form-label-color: $gray-600;

// ---------- Componentes ----------
$card-border-color: $gray-200;
$card-border-radius: $border-radius-lg;
$card-cap-bg: $white;
$card-spacer-y: 1.25rem;
$card-spacer-x: 1.25rem;

$table-cell-padding-y: .75rem;
$table-cell-padding-x: 1rem;
$table-border-color: $gray-200;
$table-th-font-weight: 500;
$table-hover-bg: #F9FAFC;      // gray-50
$table-group-separator-color: $gray-200;

$dropdown-border-color: $gray-200;
$dropdown-box-shadow: $box-shadow;
$dropdown-link-hover-bg: $gray-100;

$progress-height: 6px;
$progress-bg: $gray-200;
$progress-border-radius: $border-radius-pill;

$badge-font-weight: 500;
$badge-border-radius: $border-radius-sm;

$modal-content-border-radius: $border-radius-lg;
$modal-content-box-shadow-sm-up: $box-shadow-lg;

// ---------- Tokens que Bootstrap no tiene → variables CSS ----------
:root {
  --cc-gold: #{$cc-gold};
  --cc-sand: #{$cc-sand};
  --cc-gray-50: #F9FAFC;
  --cc-surface-subtle: #{$cc-mist};
  --cc-primary-hover: #0E4161;
  --cc-primary-active: #063653;
  --cc-shadow-xs: 0 1px 2px rgba(20, 27, 36, .06);
  --cc-space-5: 1.25rem;

  --cc-sidebar-width: 260px;
  --cc-sidebar-width-collapsed: 72px;
  --cc-topbar-height: 64px;
  --cc-toolbar-height: 64px;
  --cc-side-panel-width: 360px;

  // Gráficos: orden fijo, validado (ver DESIGN.md › Gráficos)
  --cc-chart-1: #005B8A;
  --cc-chart-2: #BF873A;
  --cc-chart-3: #3691BA;
  --cc-chart-4: #9A5929;
  --cc-chart-5: #2B9477;
  --cc-chart-6: #7E65A9;
  --cc-chart-other: #{$gray-400};
  --cc-chart-seq-1: #86B8DD;
  --cc-chart-seq-2: #5D99C4;
  --cc-chart-seq-3: #3A7BA7;
  --cc-chart-seq-4: #1F5E85;
  --cc-chart-seq-5: #0E4161;
  --cc-chart-grid: #{$gray-200};
  --cc-chart-tick: #{$gray-500};
}
```

Orden en `main.scss`:

```scss
@import "tokens";
@import "bootstrap/scss/bootstrap";
@import "components";   // .btn-neutral, .btn-accent, sidebar, línea guía, leyenda
```

> Bootstrap 5.3 todavía usa `@import`, así que Dart Sass muestra warnings de deprecación. Se silencian en `vite.config.ts` con `css.preprocessorOptions.scss.silenceDeprecations: ['import', 'global-builtin', 'color-functions']` y `quietDeps: true`. No afectan el resultado.

## Fuera de alcance

- **Modo oscuro:** no entra en el MVP. Si se hace, se definen pasos oscuros propios desde las mismas rampas y se revalidan los gráficos contra el fondo oscuro; no se invierte automáticamente.

## Pendiente

- [ ] Tipografía (actualizar `$cc-font-sans`)
- [ ] Librería de íconos: **Bootstrap Icons** (misma familia, cero decisiones extra) o **Lucide** (`lucide-vue-next`, trazo fino, más parecido al video). Cualquiera de las dos va al *Registro de conceptos nuevos*.
- [ ] Versión del logo con fondo transparente (PNG/SVG) para el sidebar; `logo.jpg` tiene fondo blanco y se ve cargado a 40px.
