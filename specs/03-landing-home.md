# SPEC 03 — Landing page de Inicio

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-15
> **Objective:** Sustituir el marcador "HOLA MUNDO" de `/` por la landing page de `references/templates/home-about/home.jsx`, con el mismo aspecto, textos y secciones.

## Por qué existe esta spec

SPEC 02 dejó `/` libre con un marcador provisional.
El template `references/templates/home-about/` trae la landing definitiva (y una página "Acerca de" que aquí no se toca).
Esta spec porta sólo la Home a la arquitectura del proyecto: Server Components, `next/link` y CSS en `app/globals.css`.

## Scope

**In:**

- Landing en `/` con las secciones de `home.jsx`, en este orden:
  - **Hero:** 8 siluetas pixel flotantes, eyebrow "▸ INSERTA UNA MONEDA_", título en tres líneas "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA", subtítulo, CTAs "▶  EXPLORAR JUEGOS" y "✦  CREAR CUENTA", indicador "DESLIZA ▼".
  - **// 01 ¿POR QUÉ ARCADE VAULT?:** 4 tarjetas de características con icono pixel (GAMEPAD, FREE, TROPHY, ROCKET).
  - **// 02 JUEGOS DISPONIBLES AHORA:** rail con los 6 primeros juegos de `GAMES` y botón "VER TODOS LOS JUEGOS →".
  - **Estadísticas:** 3 bloques ("12+ JUEGOS", "MILES DE PARTIDAS", "GLOBAL RANKING").
  - **// 03 ACTIVIDAD EN VIVO:** "▸ ÚLTIMAS PUNTUACIONES" (7 filas) y "▸ TOP JUGADORES · HOY" (5 filas) con enlace "VER SALÓN →".
  - **// 04 PRECIOS:** tarjeta "JUGADOR VAULT" ($0 / SIEMPRE, 6 ventajas, sello "FREE PLAY") y 3 preguntas frecuentes.
  - **CTA final:** "¿LISTO PARA JUGAR?" con botón "INSERTAR MONEDA →".
- Textos y datos mock copiados literalmente del template, aunque no coincidan con el catálogo real (p. ej. "Arkanoid, Tetris, Snake", "12+").
- Animación de aparición al hacer scroll (`.reveal` → `.reveal.in`) mediante `IntersectionObserver` en un Client Component.
- Destinos de navegación:
  - "▶  EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" → `/games`.
  - "✦  CREAR CUENTA" y "EMPEZAR GRATIS →" → `/login?tab=registro`.
  - Cada mini-tarjeta → `/games/<id>`.
  - "VER SALÓN →" → `/salon`.
- `/login?tab=registro` abre el formulario en la pestaña "CREAR CUENTA". `/login` sin parámetro (o con otro valor) sigue abriendo "INICIAR SESIÓN".
- CSS de la Home portado a `app/globals.css`.
- Comprobación visual con el Playwright MCP del proyecto contra `references/templates/home-about/arcade-vault-standalone.html`, a 1440px y 390px de ancho.

**Out of scope (for future specs):**

- Página "Acerca de" (`about.jsx`) y su enlace "Acerca de" en la nav.
- Cualquier cambio en la nav o el footer.
- Adaptar los textos al catálogo real o sustituir los datos mock por datos reales.
- Mostrar en "ACTIVIDAD EN VIVO" las puntuaciones guardadas en `av_scores`.
- Reflejar en la URL el cambio de pestaña dentro de `/login`.
- Los estilos del template que no son de la Home (ABOUT PAGE, GAMEPAD, tweaks).

## Modelo de datos

Esta feature no introduce estructuras persistentes. Reutiliza `GAMES` y `Game` de `lib/games.ts` (SPEC 01).

Los contenidos mock de la Home se declaran como constantes tipadas en `app/page.tsx`, con los valores literales del template:

```ts
type Feature = { icon: FeatureIconKind; title: string; desc: string; color: "cyan" | "yellow" | "magenta" | "green" };
type Stat = { n: string; u: string; s: string };
type Tick = { player: string; game: string; score: number; ago: string; color: "cyan" | "yellow" | "magenta" | "green" };
type TopPlayer = { rank: number; player: string; score: number };
type Faq = { q: string; a: string };

// components/home/feature-icon.tsx
export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
```

Pestaña inicial de acceso:

```ts
// components/auth-form.tsx
type Tab = "in" | "up";
// "?tab=registro" → "up"; ausente o cualquier otro valor → "in"
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`, como en SPEC 01.
- Los `transitionDelay` / `animationDelay` escalonados del template se mantienen como `style` inline (dependen del índice).

## Plan de implementación

1. Portar a `app/globals.css` los bloques `HOME PAGE`, `ACTIVITY` y `PRICING` de `references/templates/home-about/styles.css`, sin duplicar `.fade-in` ni `.slide-in` (ya existen). Renombrar los keyframes `bounce` → `av-bounce` y `float` → `av-float` (y sus `animation`), con el mismo criterio que `av-pulse`. Verificación: `npm run build` compila y las páginas existentes no cambian.
2. Crear `components/home/feature-icon.tsx` (`FeatureIcon` + tipo `FeatureIconKind`) y `components/home/floating-silhouettes.tsx` (`FloatingSilhouettes`), ambos Server Components con los SVG del template.
3. Crear `components/home/mini-card.tsx`: `MiniCard` que renderiza un `next/link` con clase `mini-card` hacia `/games/<id>`.
4. Crear `components/home/reveal-observer.tsx` (Client Component, devuelve `null`): en un efecto observa todos los `.reveal`, añade `in` al entrar en pantalla (umbral 0.12), deja de observarlos y desconecta al desmontar.
5. Reemplazar `app/page.tsx` por la Home: Server Component que compone las 7 secciones del template con las constantes mock, `FloatingSilhouettes`, `FeatureIcon`, `MiniCard` y `<RevealObserver />`. Los `button` del template pasan a `Link` con las mismas clases y los destinos del Scope.
6. Modificar `components/auth-form.tsx`: `AuthForm` recibe la prop `initialTab: Tab` para el estado inicial de la pestaña. Añadir y exportar `AuthFormFromParams` (Client Component) que lee `useSearchParams()` y renderiza `<AuthForm initialTab={tab === "registro" ? "up" : "in"} />`.
7. Modificar `app/login/page.tsx`: renderizar `<Suspense fallback={<AuthForm initialTab="in" />}><AuthFormFromParams /></Suspense>`. Verificación: `npm run build` no muestra el error "Missing Suspense boundary with useSearchParams".
8. Revisión visual con `/frontend-design` y el Playwright MCP: capturar `/` y `arcade-vault-standalone.html` (vista Inicio) a 1440px y 390px, recorrer todas las secciones haciendo scroll y corregir diferencias.

## Criterios de aceptación

- [X] `npm run build` termina sin errores.
- [X] `npm run lint` termina sin errores.
- [X] La consola del navegador no muestra errores ni avisos de hidratación en `/`, `/login` y `/login?tab=registro`.
- [X] `/` muestra el título "EL ARCADE", "CLÁSICO ESTÁ", "DE VUELTA" y ya no muestra "HOLA MUNDO".
- [X] El hero contiene 8 siluetas animadas.
- [X] La sección "// 01" muestra 4 tarjetas: JUEGOS CLÁSICOS, 100% GRATIS, LADDER BOARDS, SIEMPRE CRECIENDO.
- [X] La sección "// 02" muestra 6 mini-tarjetas: BLOQUE BUSTER, CAÍDA, SERPENTINA, GLOTÓN, INVASORES, ROCAS.
- [X] La franja de estadísticas muestra 3 bloques: "12+", "MILES", "GLOBAL".
- [X] "▸ ÚLTIMAS PUNTUACIONES" muestra 7 filas y "▸ TOP JUGADORES · HOY" muestra 5 filas, con NEONFOX en la #01.
- [ ] La sección "// 04 PRECIOS" muestra "$0", 6 ventajas, el sello "FREE PLAY" y 3 preguntas frecuentes.
- [ ] Al cargar `/` las secciones con `.reveal` están ocultas y aparecen al hacer scroll hasta ellas.
- [X] "▶  EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/games`.
- [X] "✦  CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/login?tab=registro`.
- [X] `/login?tab=registro` muestra la pestaña "CREAR CUENTA" activa y el campo "Correo electrónico".
- [ ] `/login` y `/login?tab=otro` muestran la pestaña "INICIAR SESIÓN" activa y sin campo de correo.
- [ ] Cambiar de pestaña en `/login?tab=registro` no cambia la URL.
- [ ] Pulsar la mini-tarjeta de CAÍDA navega a `/games/caida`.
- [X] "VER SALÓN →" navega a `/salon`.
- [X] La nav sigue mostrando sólo "Inicio", "Biblioteca" y "Salón de la Fama", con "Inicio" activo en `/`.
- [ ] A 1440px las características se ven en 4 columnas y el rail en 6 columnas; a 390px las características se ven en 1 columna y el rail en 2.
- [ ] Las capturas de Playwright de `/` a 1440px y 390px coinciden con las del template en orden de secciones, textos, colores y distribución.

## Decisiones

- **Sí:** textos y datos mock literales del template. Fidelidad total; adaptarlos va en otra spec de contenido.
- **No:** adaptar ahora "Arkanoid, Tetris, Snake" y "12+" al catálogo de 8 juegos. Exigiría redactar textos nuevos.
- **Sí:** "CREAR CUENTA" y "EMPEZAR GRATIS" enlazan a `/login?tab=registro`. El usuario aterriza directamente en el registro.
- **No:** enlazar a `/login` sin parámetro. Obligaría a cambiar de pestaña a mano.
- **Sí:** `useSearchParams` en un Client Component (`AuthFormFromParams`) dentro de `<Suspense>`. `/login` sigue prerenderizándose.
- **No:** leer la prop `searchParams` en `app/login/page.tsx`. Más código de servidor y parte dinámica sin beneficio.
- **Sí:** fallback `<AuthForm initialTab="in" />`. `/login` se ve igual que hoy en el HTML inicial.
- **No:** fallback `null`. El formulario no estaría en el HTML inicial.
- **Sí:** `?tab` sólo fija la pestaña inicial; después es estado local. Coherente con el salón en SPEC 01.
- **No:** sincronizar la pestaña con la URL mediante `router.replace`.
- **Sí:** animación `.reveal` en un Client Component mínimo que devuelve `null`. La página y sus secciones siguen siendo Server Components.
- **Sí:** componentes de la Home en `components/home/`. Agrupa las piezas propias de la landing.
- **Sí:** CSS de la Home copiado a `app/globals.css`. Mismo criterio que SPEC 01.
- **No:** un `app/home.css` aparte. Rompe la convención de un único CSS global.
- **Sí:** renombrar los keyframes `bounce` → `av-bounce` y `float` → `av-float`. `bounce` choca con el keyframe de Tailwind del mismo nombre (como pasó con `pulse`). `float` se renombra igual por consistencia.
- **Sí:** los `button` del template con `navigate()` pasan a `next/link`. URLs reales y prefetch.
- **Sí:** comprobación visual con el Playwright MCP a 1440px y 390px, más la revisión con `/frontend-design` que pide `CLAUDE.md`.
- **No:** página "Acerca de" ni su enlace en la nav. Lo pidió el usuario explícitamente.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Sin JavaScript, las secciones `.reveal` quedan ocultas (`opacity: 0`) | Se acepta por fidelidad al template. `RevealObserver` se monta en cuanto hidrata la página. |
| `.mini-card` pasa de `div` a `a` y puede cambiar su `display` o color de texto | Comprobar en el paso 8 y añadir en `globals.css` sólo lo necesario para igualar el template. |
| Reglas de la Home que choquen con clases existentes de `globals.css` | Portar sólo los tres bloques indicados y verificar en el paso 1 que las páginas existentes no cambian. |
| El Playwright MCP no conecta o no abre `file://` | Reintentar la conexión. Si no abre `file://`, servir `references/templates/home-about/` con un servidor estático local. |
| `useSearchParams` sin `Suspense` rompe el build | El paso 7 envuelve `AuthFormFromParams` en `<Suspense>` y se verifica con `npm run build`. |

## Qué **no** entra en esta spec

- Página "Acerca de" y su enlace en la nav.
- Textos adaptados al catálogo real.
- Datos reales en actividad, ranking o estadísticas.
- Pestaña de `/login` sincronizada con la URL.
- Estilos del template ajenos a la Home.

Cada uno de estos puntos, si llega, va en su propia spec.
