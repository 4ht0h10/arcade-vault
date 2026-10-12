# SPEC 01 — MVP visual de Arcade Vault

> **Status:** Implementado
> **Depends on:** —
> **Date:** 2026-10-12
> **Objective:** Portar a Next.js App Router las cinco pantallas de `references/templates/` (biblioteca, detalle, reproductor, acceso y salón de la fama) con datos mock, sin implementar ningún juego real.

## Por qué existe esta spec

El repositorio sólo tiene el scaffold de Next y los estilos del template ya portados a `app/globals.css`.
El prototipo de `references/templates/` es una SPA con React UMD + Babel y navegación por hash.
Esta spec traduce ese prototipo a la arquitectura real del proyecto (rutas App Router, TypeScript estricto, Server/Client Components) sin cambiar su aspecto.

## Scope

**In:**

- Navegación con rutas reales del App Router:
  - `/` → Biblioteca (hero, buscador, chips de categoría, grid de tarjetas, estado "NO HAY RESULTADOS").
  - `/juegos/[id]` → Detalle (portada, tags, descripción, stat-strip, acciones, leaderboard de 10 filas).
  - `/juegos/[id]/jugar` → Reproductor (HUD, CRT con arena CSS animada, pausa, modal de fin de juego).
  - `/login` → Acceso (pestañas iniciar sesión / crear cuenta, invitado, botones sociales decorativos).
  - `/salon` → Salón de la Fama (pestañas por juego, podio, tabla de 12 filas, fila "tu mejor marca" si hay sesión).
- Nav global (logo, enlaces con estado activo, contador de créditos fijo "03", botón de sesión, menú móvil con hamburguesa y backdrop) y footer global, ambos en `app/layout.tsx`.
- Página 404 arcade en `app/not-found.tsx` para ids de juego inexistentes.
- Simulación visual de partida en el reproductor, idéntica al template: puntuación que sube sola cada 220 ms, subida de nivel, PAUSA/REANUDAR, FIN abre el modal, "GUARDAR PUNTUACIÓN", "JUGAR DE NUEVO", "VOLVER AL VAULT", "SALIR".
- Sesión mock en `localStorage`: login/registro falso guarda el usuario, la nav muestra su nombre y permite cerrar sesión.
- Guardado mock de puntuaciones en `localStorage` (sólo escritura).
- Datos mock tipados (8 juegos, categorías, generador determinista de rankings).
- Reemplazo del boilerplate de `app/page.tsx`.

**Out of scope (for future specs):**

- Cualquier juego jugable real (canvas, input de teclado, lógica de juego).
- Backend, base de datos, API routes o Server Actions.
- Autenticación real, validación de formularios, OAuth de Google/GitHub.
- Mostrar las puntuaciones de `av_scores` en los rankings (los rankings son siempre mock).
- Pestaña del salón reflejada en la URL (`?juego=id`).
- Sistema de créditos funcional.
- Migrar las clases de `globals.css` a utilidades Tailwind.
- Framework de tests.

## Modelo de datos

`lib/games.ts` (portado de `references/templates/data.jsx`, mismos valores):

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug usado en la URL: "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS de portada: "cover-bricks"
  color: GameColor;
  best: number;
  plays: string;       // "12.4K"
};

export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date "DD/MM/2026"

export const GAMES: Game[];
export const CATS: readonly ["TODOS", ...GameCategory[]];
export function getGame(id: string): Game | undefined;
export function seededScores(seed: number, count?: number): ScoreRow[];
```

`lib/session.ts` (helpers de `localStorage`, sólo cliente):

```ts
export type SessionUser = { name: string };   // name en mayúsculas, máx. 10 caracteres
export type SavedScore = { game: string; score: number; name: string; at: number };

// Claves (las mismas del template):
// "av_user"   → JSON SessionUser | ausente
// "av_scores" → JSON SavedScore[]
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- Las semillas de rankings son las del template: detalle `id.length * 17 + 3` (10 filas), salón `id.length * 23 + 7` (12 filas).
- Si `localStorage` falla o el JSON es inválido, se trata como "sin sesión" / lista vacía.

## Plan de implementación

1. Crear `lib/games.ts` con los tipos, `GAMES`, `CATS`, `getGame` y `seededScores`. Verificación: `npm run build` compila.
2. Crear `lib/session.ts` con `readUser`, `writeUser`, `clearUser` y `appendScore`, protegidos con `try/catch`.
3. Crear `components/session-provider.tsx` (Client Component con Context) que expone `{ user, login, logout }`. Lee `av_user` tras el montaje para evitar desajustes de hidratación.
4. Crear `components/nav.tsx` (Client Component): logo y enlaces con `next/link`, activo según `usePathname()` (Biblioteca activa en `/` y `/juegos/*`), menú móvil, botón de sesión que hace `logout` si hay usuario o lleva a `/login` si no.
5. Crear `components/footer.tsx` y actualizar `app/layout.tsx` para envolver en `SessionProvider`, renderizar `Nav`, `<main className="av-main">` y `Footer`.
6. Crear `components/game-card.tsx` (Client Component con efecto tilt) y `components/library-browser.tsx` (buscador + chips + grid + estado vacío). Reemplazar `app/page.tsx` por el hero + `LibraryBrowser`.
7. Crear `app/juegos/[id]/page.tsx` (Server Component) con `generateStaticParams` sobre `GAMES` y `notFound()` si el id no existe. Leer en `node_modules/next/dist/docs/` cómo se reciben `params` y cómo interactúa con `cacheComponents` antes de escribirlo.
8. Crear `app/not-found.tsx` con estética arcade y botón "VOLVER AL VAULT".
9. Crear `components/game-player.tsx` (Client Component con la simulación, HUD, CRT, overlay de pausa y modal; usa `useSession` para el nombre y `appendScore` al guardar) y `app/juegos/[id]/jugar/page.tsx` que valida el id y lo renderiza.
10. Crear `app/login/page.tsx` + `components/auth-form.tsx` (Client Component): pestañas, campo email sólo en "CREAR CUENTA", submit hace `login({ name })` y navega a `/`; "JUGAR COMO INVITADO" hace `logout` y navega a `/`.
11. Crear `app/salon/page.tsx` + `components/hall-of-fame.tsx` (Client Component): pestañas por juego en estado local, podio, tabla animada y fila "TU MEJOR MARCA" cuando hay sesión.
12. Aplicar `/frontend-design` para revisar la fidelidad visual contra `references/templates/Arcade Vault.html` y ajustar detalles (estilos inline del template → utilidades Tailwind con los tokens de `@theme`).

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores (cubre sólo el código del proyecto; `references/**` está excluido en `eslint.config.mjs`).
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en ninguna ruta.
- [ ] `/` muestra el hero "ARCADE VAULT" y 8 tarjetas de juego.
- [ ] Escribir "ser" en el buscador deja sólo la tarjeta SERPENTINA.
- [ ] Pulsar el chip "SHOOTER" deja sólo INVASORES y ROCAS.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Pulsar una tarjeta o su botón JUGAR navega a `/juegos/<id>`.
- [ ] `/juegos/caida` muestra título CAÍDA, stat-strip con "31.8K" y "184.220", y un leaderboard de 10 filas con las 3 primeras en oro/plata/bronce.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la página 404 arcade.
- [ ] "▶ JUGAR AHORA" navega a `/juegos/<id>/jugar`; "VOLVER AL VAULT" navega a `/`.
- [ ] En el reproductor la puntuación aumenta sola; PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la reanuda.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] "GUARDAR PUNTUACIÓN" añade una entrada `{ game, score, name, at }` a `av_scores` y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] "JUGAR DE NUEVO" reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] "SALIR" navega a `/juegos/<id>`.
- [ ] En `/login`, la pestaña "CREAR CUENTA" muestra el campo de correo y "INICIAR SESIÓN" lo oculta.
- [ ] Enviar el formulario con usuario "kai" navega a `/` y la nav muestra "KAI ▾".
- [ ] Recargar la página mantiene "KAI ▾" en la nav.
- [ ] Pulsar "KAI ▾" cierra la sesión y la nav vuelve a mostrar "Iniciar Sesión".
- [ ] `/salon` muestra podio de 3 y tabla de 12 filas; cambiar de pestaña cambia los nombres.
- [ ] Con sesión iniciada, `/salon` muestra la fila "▸ TU MEJOR MARCA EN <JUEGO>"; sin sesión no aparece.
- [ ] El enlace activo de la nav se resalta en `/`, `/juegos/*` (Biblioteca) y `/salon` (Salón de la Fama).
- [ ] Con ancho ≤ 840px los enlaces se ocultan, aparece la hamburguesa y el panel lateral abre y cierra con el backdrop.

## Decisiones

- **Sí:** rutas reales del App Router en vez de SPA con hash. URLs compartibles y detalle prerenderizable.
- **No:** replicar la navegación por hash del template. Desaprovecha Next y complica el historial.
- **Sí:** rutas en español (`/juegos`, `/salon`, `/login`), coherentes con la UI.
- **Sí:** simulación de partida idéntica al template. Permite ver todos los estados visuales del reproductor sin juego real.
- **No:** placeholder "PRÓXIMAMENTE" o HUD estático. Dejaría sin validar el modal y la pausa.
- **Sí:** sesión y puntuaciones mock en `localStorage` con las claves del template (`av_user`, `av_scores`).
- **No:** sólo visual sin estado. La nav y el salón no mostrarían su variante con sesión.
- **Sí:** `SessionProvider` con Context para que nav, login, reproductor y salón compartan el usuario. La nav vive en el layout y debe reaccionar al login.
- **Sí:** rankings siempre mock (`seededScores`). Fusionar `av_scores` va en otra spec.
- **Sí:** reutilizar las clases ya portadas en `app/globals.css`. Tailwind sólo sustituye los estilos inline del template.
- **No:** reescribir todo con utilidades Tailwind. Más trabajo y riesgo de diferencias visuales.
- **Sí:** `lib/` para datos y helpers, `components/` para componentes compartidos, `app/` sólo para rutas.
- **No:** carpetas privadas `app/_lib`, `app/_components`.
- **Sí:** pestaña del salón en estado local. Evita `searchParams` dinámico y el `Suspense` que exige `cacheComponents`.
- **Sí:** `notFound()` + `app/not-found.tsx` para ids inexistentes.
- **No:** redirigir a `/`. Oculta el error al usuario.
- **Sí:** las páginas son Server Components y la interactividad vive en Client Components hoja.
- **Sí:** excluir `references/**` del lint. Los `.jsx` del prototipo usan React UMD global y no son código del proyecto.
- **No:** borrar `references/`. Se necesita como referencia visual.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Desajuste de hidratación al leer `localStorage` durante el render | `SessionProvider` empieza con `user = null` y lee `av_user` en un efecto tras el montaje. |
| `cacheComponents` cambia cómo se prerenderizan rutas dinámicas y `params` | Leer la documentación de `node_modules/next/dist/docs/` antes del paso 7 y usar `generateStaticParams`. |
| `seededScores` puede repetir nombres si `count` supera la lista de jugadores | Se mantiene `count ≤ 12` (hay 18 jugadores en `PLAYERS`). |
| Intervalo de la simulación sigue vivo al salir del reproductor | El `useEffect` limpia el `setInterval` al desmontar y al pausar o terminar. |

## Qué **no** entra en esta spec

- Juegos jugables reales.
- Backend, autenticación real u OAuth.
- Rankings alimentados por `av_scores`.
- Créditos funcionales.
- Tests automatizados.

Cada uno de estos puntos, si llega, va en su propia spec.
