## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.  
los juegos son un pocco maduritos ya, como yo mismo.

Arcade Vault reúne versiones propias de arcades clásicos en una biblioteca que se juega directamente en el navegador, sin instalar nada y sin coste. La idea es recuperar la experiencia de los salones recreativos: elegir un juego, echar una partida rápida y volver a intentarlo para superar tu récord y el de los demás.

Todo ello con una estética retro de neón y pixel art: rejilla en perspectiva, scanlines, tipografía pixelada y colores fosforito.

### Qué incluye

- **Inicio:** landing que presenta la plataforma, los juegos destacados, la actividad reciente y las preguntas frecuentes.
- **Biblioteca (`/games`):** catálogo de juegos con su ficha y su pantalla de partida. Títulos como _Bloque Buster_, _Caída_, _Serpentina_, _Glotón_, _Invasores_, _Rocas_, _Ranaria_ o _Duelo Pixel_.
- **Salón de la Fama (`/salon`):** ranking con las mejores puntuaciones de cada juego.
- **Sesión (`/login`):** inicia sesión o juega como invitado; con sesión, tus puntuaciones se guardan para aparecer en el ranking.
- **Acerca de (`/about`):** la misión del proyecto y un formulario de contacto que envía un correo real al equipo mediante [Resend](https://resend.com).

### Estado actual

El proyecto está en construcción. Las pantallas visuales están completas, pero las partidas, la sesión y las puntuaciones todavía son simuladas y se guardan en el navegador (`localStorage`). El formulario de contacto sí funciona de extremo a extremo.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Cache Components) y React 19
- TypeScript en modo estricto
- Tailwind CSS v4
- [Resend](https://resend.com) para el envío de correos desde una Server Action

## Usa Spec Driven Design

Desarrollado según SDD usando las SKILLS **/spec** y **/spec-impl**

Siguiendo las buenas practicas recomendadas 👉 https://github.com/Klerith/fernando-skills

Cada funcionalidad nace como una spec en la carpeta `specs/`, se aprueba y después se implementa paso a paso en su propia rama.

## Instalación de las Skills para SDD usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Puesta en marcha

```bash
npm install
cp .env.template .env.local   # rellena RESEND_API_KEY y CONTACT_TO_EMAIL
npm run dev
```

La aplicación queda disponible en http://localhost:3000.

Las variables de entorno sólo hacen falta para el formulario de contacto. Con el remitente de pruebas `onboarding@resend.dev`, `CONTACT_TO_EMAIL` debe ser el email de tu cuenta de Resend.

## Supabase

La app incluye los clientes de [Supabase](https://supabase.com) en `lib/supabase/` (`server.ts` para Server Components, Server Actions y Route Handlers; `client.ts` para Client Components). Todavía ninguna pantalla los usa.

Variables necesarias en `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto (`https://<ref>.supabase.co`).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key (`sb_publishable_…`), no la anon key legacy.

Ambas están en el dashboard de Supabase, en **Project Settings → API Keys** y **Data API**. Son públicas: llegan al navegador y la seguridad de los datos depende de RLS.

Para comprobar la conexión (requiere Node 24):

```bash
npm run supabase:check
```

Imprime `[OK] Supabase conectado: <url>` o `[ERR] <motivo>` y sale con código 1.

## Commands

- `npm run dev`: dev server (Turbopack)
- `npm run build`: production build (also runs type checking)
- `npm run lint`: ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- `npx tsc --noEmit`: type check only
- `npm run supabase:check`: checks the Supabase connection with the vars from `.env.local`

## Autores

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/4ht0h10">
        <img src="https://github.com/4ht0h10.png" alt="Avatar de 4ht0h10 en GitHub" width="120" height="120" />
      </a>
      <br />
      <b><a href="https://github.com/4ht0h10">@4ht0h10</a></b>
    </td>
    <td align="center">
      <a href="https://claude.com/claude-code">
        <img src="https://cdn.simpleicons.org/claude" alt="Logo de Claude" width="120" height="120" />
      </a>
      <br />
      <b><a href="https://claude.com/claude-code">Claude Code</a></b>
    </td>
  </tr>
</table>
