# SPEC 02 — Página de Inicio y Biblioteca en /games

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-15
> **Objective:** Añadir una página de Inicio provisional "HOLA MUNDO" en `/`, enlazada como "Inicio" en la nav antes de "Biblioteca", y mover la Biblioteca y sus rutas de juego al árbol `/games`.

## Por qué existe esta spec

En SPEC 01 la Biblioteca ocupa `/`.
La landing definitiva de Arcade Vault se diseñará en una spec posterior, pero necesita `/` libre.
Esta spec sólo reorganiza las rutas y deja un marcador mínimo en `/`.

## Scope

**In:**

- Nueva página de Inicio en `/` con un hero mínimo: `<h1>` "HOLA MUNDO" dentro de `av-hero`, sin subtítulo ni botones.
- La Biblioteca (hero "ARCADE VAULT" + `LibraryBrowser`) pasa de `/` a `/games`.
- El detalle pasa de `/juegos/[id]` a `/games/[id]`.
- El reproductor pasa de `/juegos/[id]/jugar` a `/games/[id]/play`.
- Nav (barra y panel móvil): nuevo enlace "Inicio" → `/`, situado antes de "Biblioteca"; "Biblioteca" → `/games`.
- Estado activo: "Inicio" sólo en `/`; "Biblioteca" en `/games` y `/games/*`.
- El logo sigue enlazando a `/` (Inicio).
- Todos los botones "VOLVER AL VAULT" (detalle, reproductor, salón, 404) navegan a `/games`.
- Tras enviar el formulario de `/login` o pulsar "JUGAR COMO INVITADO" se navega a `/games`.
- Las tarjetas de juego enlazan a `/games/<id>`; "▶ JUGAR AHORA" a `/games/<id>/play`; "SALIR" del reproductor a `/games/<id>`.

**Out of scope (for future specs):**

- Diseño y contenido real de la página de Inicio (incluidas las referencias de `references/templates/home-about/`).
- Página "Acerca de" u otros enlaces nuevos en la nav.
- Redirects de las URLs antiguas `/juegos/*`.
- Renombrar al inglés el resto de rutas (`/salon`, `/login`).
- Cambios visuales en la Biblioteca, el detalle o el reproductor.

## Modelo de datos

Esta feature no introduce estructuras de datos nuevas. Reutiliza el modelo de SPEC 01 (`lib/games.ts`, `lib/session.ts`) sin cambios.

Mapa de rutas resultante:

| Ruta | Pantalla |
| --- | --- |
| `/` | Inicio ("HOLA MUNDO") |
| `/games` | Biblioteca |
| `/games/[id]` | Detalle |
| `/games/[id]/play` | Reproductor |
| `/salon` | Salón de la Fama (sin cambios) |
| `/login` | Acceso (sin cambios) |

## Plan de implementación

1. Crear `app/games/page.tsx` con el contenido actual de `app/page.tsx` (hero "ARCADE VAULT" + `LibraryBrowser`). Verificación: `/games` muestra la Biblioteca.
2. Reemplazar `app/page.tsx` por la página de Inicio: `<div className="fade-in">` con `<section className="av-hero"><h1 className="flicker">HOLA MUNDO</h1></section>`. Verificación: `/` muestra "HOLA MUNDO".
3. Mover con `git mv` `app/juegos/[id]/page.tsx` → `app/games/[id]/page.tsx` y `app/juegos/[id]/jugar/page.tsx` → `app/games/[id]/play/page.tsx`, conservando `generateStaticParams`, `notFound()` y la lectura de `params` dentro de `Suspense`. Eliminar `app/juegos/`.
4. Actualizar los enlaces internos a las rutas nuevas:
   - `components/game-card.tsx`: `href` → `/games/<id>`.
   - `app/games/[id]/page.tsx`: "▶ JUGAR AHORA" → `/games/<id>/play`; "VOLVER AL VAULT" → `/games`.
   - `components/game-player.tsx`: "SALIR" → `/games/<id>`; "VOLVER AL VAULT" → `/games`.
   - `components/hall-of-fame.tsx` y `app/not-found.tsx`: "VOLVER AL VAULT" → `/games`.
   - `components/auth-form.tsx`: ambos `router.push("/")` → `router.push("/games")`.
5. Actualizar `components/nav.tsx`: añadir `isHome = pathname === "/"`; cambiar `isLibrary` a `pathname === "/games" || pathname.startsWith("/games/")`; añadir el enlace "Inicio" antes de "Biblioteca" en la barra y en el panel móvil (este último con `onClick={close}`); "Biblioteca" apunta a `/games`.
6. Buscar restos con `grep -rn "/juegos" app components lib` y confirmar que no queda ninguno.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en `/`, `/games`, `/games/caida` y `/games/caida/play`.
- [ ] `/` muestra el hero con el texto "HOLA MUNDO" y ninguna tarjeta de juego.
- [ ] `/games` muestra el hero "ARCADE VAULT" y 8 tarjetas de juego.
- [ ] La nav muestra, en este orden: "Inicio", "Biblioteca", "Salón de la Fama", tanto en la barra como en el panel móvil.
- [ ] En `/` sólo "Inicio" está activo.
- [ ] En `/games`, `/games/caida` y `/games/caida/play` sólo "Biblioteca" está activo.
- [ ] Pulsar el logo navega a `/`.
- [ ] Pulsar una tarjeta o su botón JUGAR navega a `/games/<id>`.
- [ ] "▶ JUGAR AHORA" navega a `/games/<id>/play`.
- [ ] "SALIR" en el reproductor navega a `/games/<id>`.
- [ ] "VOLVER AL VAULT" navega a `/games` desde el detalle, el modal del reproductor, el salón y la 404.
- [ ] Enviar el formulario de `/login` con usuario "kai" navega a `/games` y la nav muestra "KAI ▾".
- [ ] "JUGAR COMO INVITADO" navega a `/games`.
- [ ] `/juegos/caida` y `/juegos/caida/jugar` muestran la página 404 arcade.
- [ ] `/games/no-existe` y `/games/no-existe/play` muestran la página 404 arcade.
- [ ] `grep -rn "/juegos" app components lib` no devuelve resultados.

## Decisiones

- **Sí:** Biblioteca en `/games`, petición explícita del usuario.
- **Sí:** mover también detalle y reproductor a `/games/[id]` y `/games/[id]/play`. Mantiene todo el árbol de juegos bajo un mismo prefijo e idioma.
- **No:** mantener `/juegos/[id]`. Mezclaría `/games` y `/juegos` para el mismo recurso.
- **No:** `/games/[id]/jugar`. El segmento en español rompería la coherencia del árbol `/games`.
- **Sí:** las URLs `/juegos/*` desaparecen y dan 404. El proyecto no está en producción y no hay enlaces externos que preservar.
- **No:** redirects en `next.config.ts`. Código extra sin beneficio actual.
- **Sí:** "VOLVER AL VAULT" y la navegación post-login van a `/games`. "Vault" es la colección de juegos y conserva el flujo actual del usuario.
- **Sí:** el logo enlaza a `/` (Inicio). Convención web habitual.
- **Sí:** Inicio reutiliza `av-hero` y `flicker` con sólo "HOLA MUNDO". Es un marcador; no se diseña nada nuevo.
- **No:** subtítulo o botón "VER JUEGOS" en Inicio. Se decidirá al diseñar la landing real.
- **No:** aplicar `/frontend-design` en esta spec. No hay UI nueva; se aplicará en la spec de la landing.
- **No:** renombrar `/salon` y `/login`. Fuera del alcance pedido.
- **Sí:** `git mv` para las rutas de juego. Conserva el historial y el arreglo de `params` detrás de `Suspense` (commit `d18e170`).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Perder el arreglo de `params` dentro de `Suspense` al mover las rutas | Mover con `git mv` sin reescribir el contenido; sólo cambiar los `href`. |
| Quedan enlaces a `/juegos` o a `/` que deberían ir a `/games` | Paso 6 con `grep` y criterio de aceptación específico. |
| Tipos de ruta generados por Next obsoletos tras mover carpetas | Ejecutar `npm run build` (regenera los tipos en `.next/`). |

## Qué **no** entra en esta spec

- La landing real de Inicio.
- Página "Acerca de".
- Redirects de `/juegos/*`.
- Renombrar `/salon` y `/login`.
- Cambios visuales en pantallas existentes.

Cada uno de estos puntos, si llega, va en su propia spec.
