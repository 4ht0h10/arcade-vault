# SPEC 05 — Cimientos de Supabase en Next.js

> **Status:** Aprobado
> **Depends on:** Ninguna
> **Date:** 2026-10-29
> **Objective:** Instalar `@supabase/supabase-js` y `@supabase/ssr`, crear los clientes de servidor y navegador en `lib/supabase/` y comprobar la conexión con un script `npm run supabase:check`, sin cambiar ninguna pantalla.

## Por qué existe esta spec

El proyecto ya tiene el MCP de Supabase conectado y `SUPABASE_DB_PASSWORD` en `.env.local`, pero la app no tiene ningún paquete de Supabase.
La sesión (`av_user`) y las puntuaciones (`av_scores`) son mocks en `localStorage`, y el catálogo (`GAMES`) es estático.
Migrar cualquiera de esas piezas exige primero una base común: paquetes, variables de entorno y clientes.
Esta spec sólo crea esa base para que las specs de auth, puntuaciones y catálogo partan de ella.

## Scope

**In:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr` en `package.json`.
- Variables de entorno públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`:
  - Valores reales en `.env.local` (ignorado por git).
  - Declaradas vacías en `.env.template`, junto a las ya existentes.
- `lib/supabase/server.ts`: `createClient()` asíncrona para Server Components, Server Actions y Route Handlers, con `createServerClient` de `@supabase/ssr` y las cookies de `next/headers`.
- `lib/supabase/client.ts`: `createClient()` para Client Components, con `createBrowserClient` de `@supabase/ssr`.
- Si falta alguna de las dos variables, `createClient()` lanza un `Error` con el nombre de la variable que falta.
- Script `scripts/check-supabase.ts`, ejecutado con `npm run supabase:check`:
  - Lee las variables de `.env.local` con `node --env-file=.env.local`.
  - Hace `GET <NEXT_PUBLIC_SUPABASE_URL>/auth/v1/health` con la cabecera `apikey: <NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY>`.
  - Con respuesta 2xx imprime `[OK] Supabase conectado: <url>` y sale con código 0.
  - Con variable ausente, error de red o respuesta no 2xx imprime `[ERR] <motivo>` y sale con código 1.
- Sección "Supabase" en `README.md` con las variables necesarias, de dónde se obtienen y cómo ejecutar `npm run supabase:check`.

**Out of scope (for future specs):**

- Autenticación con Supabase Auth y sustitución de `av_user`.
- `proxy.ts` para refrescar la sesión en cookies (llega con la spec de auth).
- Tabla de puntuaciones y sustitución de `av_scores`.
- Tabla de juegos y sustitución de `GAMES` de `lib/games.ts`.
- Migraciones SQL, carpeta `supabase/migrations/` y Supabase CLI local.
- Tipos generados de la base de datos (`database.types.ts`).
- Clave secreta (`SUPABASE_SECRET_KEY`) y cliente admin que salta RLS.
- Cualquier cambio visual o de comportamiento en las páginas existentes.
- Tests automatizados (no hay framework de tests configurado).

## Modelo de datos

Esta feature no introduce estructuras persistentes ni tablas. El esquema `public` del proyecto Supabase sigue vacío.

Variables de entorno:

```bash
# .env.template
RESEND_API_KEY=
CONTACT_TO_EMAIL=
SUPABASE_DB_PASSWORD=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Firmas de los clientes:

```ts
// lib/supabase/server.ts — sólo servidor
export async function createClient(): Promise<SupabaseClient>;

// lib/supabase/client.ts — "use client" / navegador
export function createClient(): SupabaseClient;
```

Script en `package.json`:

```json
"supabase:check": "node --env-file=.env.local scripts/check-supabase.ts"
```

Convenciones:

- Los clientes no se tipan con un esquema (`SupabaseClient` sin genérico) hasta que exista `database.types.ts`.
- `lib/supabase/server.ts` no se importa nunca desde un Client Component; `lib/supabase/client.ts` no se importa desde código de servidor.
- El `setAll` de cookies del cliente de servidor ignora el error al llamarse desde un Server Component, como indica la guía de `@supabase/ssr`.
- El script no importa nada de `lib/supabase/` (depende de `next/headers`); usa `fetch` nativo de Node 24 y se ejecuta con su type stripping de TypeScript.

## Plan de implementación

1. Instalar dependencias: `npm install @supabase/supabase-js @supabase/ssr`. Verificación: `npm run build` compila.
2. Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vacías a `.env.template`. Rellenar `.env.local` con la URL y la publishable key del proyecto (obtenibles con el MCP de Supabase: `get_project_url` y `get_publishable_keys`).
3. Crear `scripts/check-supabase.ts` y el script `supabase:check` en `package.json`. Verificación: `npm run supabase:check` imprime `[OK]`.
4. Leer `node_modules/next/dist/docs/` sobre `cookies()` y cache components antes de escribir el cliente de servidor. Crear `lib/supabase/server.ts` con la comprobación de variables. Verificación: `npm run build` y `npm run lint` pasan.
5. Crear `lib/supabase/client.ts` con la comprobación de variables. Verificación: `npm run build` y `npm run lint` pasan.
6. Añadir la sección "Supabase" a `README.md`.

## Criterios de aceptación

- [ ] `@supabase/supabase-js` y `@supabase/ssr` aparecen en `dependencies` de `package.json`.
- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` sin valores.
- [ ] `.env.local` no está versionado.
- [ ] Con `.env.local` correcto, `npm run supabase:check` imprime `[OK] Supabase conectado: <url>` y sale con código 0.
- [ ] Con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` incorrecta, `npm run supabase:check` imprime `[ERR]` y sale con código 1.
- [ ] Sin `NEXT_PUBLIC_SUPABASE_URL`, `npm run supabase:check` imprime `[ERR]` nombrando la variable y sale con código 1.
- [ ] `lib/supabase/server.ts` exporta una `createClient` asíncrona que usa `createServerClient` y `cookies()` de `next/headers`.
- [ ] `lib/supabase/client.ts` exporta una `createClient` que usa `createBrowserClient`.
- [ ] Ninguna página existente importa `lib/supabase/` y todas se ven y funcionan igual que antes.
- [ ] `SUPABASE_DB_PASSWORD` no aparece en ningún archivo de `.next/static`.
- [ ] `README.md` tiene una sección "Supabase" con las dos variables y el comando `npm run supabase:check`.

## Decisiones

- **Sí:** spec sólo de cimientos. Auth, puntuaciones y catálogo son tres dominios distintos y cada uno merece su spec.
- **No:** incluir ya puntuaciones, auth o catálogo. Haría la spec demasiado grande.
- **Sí:** `@supabase/supabase-js` + `@supabase/ssr`. Es el patrón oficial para App Router y deja lista la gestión de cookies para la auth.
- **No:** sólo `@supabase/supabase-js`. Habría que rehacer los clientes cuando llegue la auth.
- **Sí:** publishable key (`sb_publishable_…`) con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Es el formato actual de claves de Supabase y puede ir al navegador.
- **No:** anon key legacy. Formato antiguo.
- **No:** `SUPABASE_SECRET_KEY` y cliente admin. Nada en esta spec lo necesita.
- **No:** `proxy.ts` de refresco de sesión. Sin auth no hay sesión; sería código que se ejecuta en cada petición sin efecto.
- **Sí:** `lib/supabase/server.ts` y `lib/supabase/client.ts`, ambos exportando `createClient`. Convención oficial de Supabase y coherente con `lib/` del proyecto.
- **No:** un único `lib/supabase.ts`. Mezclaría código que importa `next/headers` con código de navegador.
- **Sí:** sin tipos generados ni migraciones. No hay tablas todavía; llegan con la primera spec que cree una.
- **Sí:** comprobación con script `npm run supabase:check` contra `/auth/v1/health`. Funciona con el esquema vacío, valida URL y clave, y no toca la app.
- **No:** página `/status` de diagnóstico ni log en un Server Component. Añadiría código a la app sólo para diagnosticar.
- **Sí:** `node --env-file` y type stripping de Node 24. Sin dependencias nuevas como `tsx` o `dotenv`.

## Riesgos

| Riesgo                                                                                                        | Mitigación                                                                                                        |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| La API de `cookies()` o el modelo de cache components de Next 16.4 difiere de los ejemplos de `@supabase/ssr` | Paso 4 obliga a leer `node_modules/next/dist/docs/` antes de escribir `lib/supabase/server.ts`.                   |
| Usar el cliente de servidor dentro de un componente cacheado provoca errores de prerender                     | Ninguna página lo usa en esta spec. La spec que lo use primero debe resolverlo según la guía de cache components. |
| La publishable key se confunde con la contraseña de la base de datos o una clave secreta                      | Sólo las variables `NEXT_PUBLIC_SUPABASE_*` llevan prefijo público. Criterio de aceptación sobre `.next/static`.  |
| La versión de Node de otro entorno no soporta type stripping                                                  | Node 24 está en uso. Si falla, se documenta en el README la versión mínima.                                       |

## Qué **no** entra en esta spec

- Supabase Auth y `proxy.ts`.
- Puntuaciones en base de datos.
- Catálogo de juegos en base de datos.
- Migraciones, Supabase CLI y tipos generados.
- Clave secreta y cliente admin.
- Cambios en las pantallas.
- Tests automatizados.

Cada uno de estos puntos, si llega, va en su propia spec.
