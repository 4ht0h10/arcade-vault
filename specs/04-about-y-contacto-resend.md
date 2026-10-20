# SPEC 04 — Página Acerca de y formulario de contacto con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 03
> **Date:** 2026-10-15
> **Objective:** Añadir la página `/about` de `references/templates/home-about/about.jsx`, enlazada como "Acerca de" en la nav, cuyo formulario de contacto envía un correo real al equipo mediante Resend.

## Por qué existe esta spec

SPEC 03 portó la Home del template y dejó fuera la página "Acerca de".
En el template el formulario es una simulación: valida campos vacíos y muestra el terminal de éxito sin enviar nada.
Esta spec porta la página con el mismo aspecto y textos, y conecta el formulario a un envío real con Resend desde el servidor.
Como el envío real puede tardar o fallar, se añaden un estado de carga y un estado de error que el template no tiene.

## Scope

**In:**

- Página en `/about` con las secciones de `about.jsx`, en este orden:
  - **Hero:** kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT", párrafo de misión.
  - **Highlights:** 3 tarjetas con icono pixel (HEART magenta, BROWSER cian, PLANT verde) y sus textos literales.
  - **Divisor:** barra + 24 píxeles parpadeantes + barra.
  - **Contacto:** kicker "▸ CONTACTO", título "CONTÁCTANOS", subtítulo, 3 tips con LED ("RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS") y formulario.
- Textos, placeholders y etiquetas copiados literalmente del template.
- Formulario con los campos NOMBRE (`name`), CORREO ELECTRÓNICO (`email`) y MENSAJE (`msg`), y botón "▶  ENVIAR MENSAJE".
- Validación en cliente igual que el template: si algún campo está vacío tras `trim`, el formulario hace shake (400 ms) y no se envía.
- Envío mediante una Server Action que valida en servidor y llama a Resend con el SDK `resend`.
- Validación en servidor:
  - `name`: no vacío tras `trim`, máximo 60 caracteres.
  - `email`: no vacío, formato de correo válido, máximo 120 caracteres.
  - `msg`: no vacío tras `trim`, máximo 2000 caracteres.
  - Si falla: el formulario hace shake, conserva los datos y no se llama a Resend.
- Honeypot: campo oculto `website`. Si llega relleno, la acción devuelve éxito sin llamar a Resend.
- Estados de la UI:
  - **Idle:** formulario del template.
  - **Enviando:** botón deshabilitado con el texto "▶  TRANSMITIENDO…".
  - **Éxito:** terminal "VAULT-OS // TERMINAL" del template con "GRACIAS, <NOMBRE>." y botón "ENVIAR OTRO MENSAJE", que vacía el formulario y vuelve a Idle.
  - **Error:** mismo terminal, con la línea de éxito sustituida por líneas `[ERR]` en magenta y un botón "REINTENTAR" que vuelve al formulario conservando los datos.
- Correo enviado:
  - From: `Arcade Vault <onboarding@resend.dev>`.
  - To: valor de `CONTACT_TO_EMAIL`.
  - Reply-To: correo introducido por el usuario.
  - Asunto: `[Arcade Vault] Mensaje de <nombre>`.
  - Cuerpo en texto plano con nombre, correo y mensaje.
- Variables de entorno `RESEND_API_KEY` y `CONTACT_TO_EMAIL` en `.env.local` (ignorado por git), documentadas en `.env.template`.
- Si falta alguna variable de entorno o Resend devuelve error: la acción registra el error en el log del servidor y la UI muestra el estado Error.
- Nav (barra y panel móvil): nuevo enlace "Acerca de" → `/about`, después de "Salón de la Fama", activo sólo en `/about`.
- Animación `.reveal` del divisor y la sección de contacto, reutilizando `RevealObserver` de SPEC 03.
- CSS del bloque `ABOUT PAGE` de `references/templates/home-about/styles.css` portado a `app/globals.css`.
- Comprobación visual con el Playwright MCP del proyecto contra `references/templates/home-about/arcade-vault-standalone.html` (vista Acerca de), a 1440px y 390px de ancho.

**Out of scope (for future specs):**

- Email de confirmación al usuario que escribe.
- Guardar los mensajes en base de datos, archivo o cualquier otro almacenamiento.
- Tests automatizados (no hay framework de tests configurado).
- Verificar un dominio propio en Resend y cambiar el remitente.
- Correo en HTML o con React Email.
- Rate limiting por IP o captcha.
- Cambios en el footer.

## Modelo de datos

Esta feature no introduce estructuras persistentes.

Estado devuelto por la Server Action:

```ts
// lib/contact.ts
export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; values: ContactValues }
  | { status: "error"; values: ContactValues }
  | { status: "sent"; name: string };

export type ContactValues = { name: string; email: string; msg: string };

// Server Action usada con useActionState
export async function sendContact(prev: ContactState, formData: FormData): Promise<ContactState>;
```

Campos del `FormData`: `name`, `email`, `msg`, `website` (honeypot).

Variables de entorno (sólo servidor, sin prefijo `NEXT_PUBLIC_`):

```bash
# .env.template
RESEND_API_KEY=
CONTACT_TO_EMAIL=
```

Iconos de los highlights:

```ts
// components/about/highlight-icon.tsx
export type HighlightIconKind = "HEART" | "BROWSER" | "PLANT";
```

Convenciones:

- El nombre del terminal de éxito se muestra con `toUpperCase()`, como en el template.
- Los `transitionDelay` / `animationDelay` escalonados del template se mantienen como `style` inline.
- Con `onboarding@resend.dev`, Resend sólo entrega correos al email propietario de la cuenta. `CONTACT_TO_EMAIL` debe ser ese email.

## Plan de implementación

1. Portar a `app/globals.css` el bloque `ABOUT PAGE` de `references/templates/home-about/styles.css` (incluidos los keyframes `pxblink` y `shake`), sin duplicar `.reveal`, `.field` ni `blink` (ya existen). Añadir la regla `.term-body .error` en magenta para las líneas `[ERR]`. Verificación: `npm run build` compila y las páginas existentes no cambian.
2. Crear `components/about/highlight-icon.tsx` (`HighlightIcon` + `HighlightIconKind`), Server Component con los SVG del template.
3. Crear `app/about/page.tsx`: Server Component con hero, highlights, divisor, intro de contacto y `<RevealObserver />`. En el hueco del formulario, un placeholder temporal. Verificación: `/about` muestra todo menos el formulario.
4. Añadir el enlace "Acerca de" a la barra y al panel móvil de `components/nav.tsx`, con `isAbout = pathname === "/about"`. Verificación: el enlace aparece y queda activo en `/about`.
5. Instalar `resend` (`npm install resend`). Crear `.env.template` con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` vacíos.
6. Crear `lib/contact.ts` con `"use server"`, los tipos del modelo de datos y `sendContact`: honeypot → validación → comprobación de variables de entorno → `resend.emails.send` con from, to, replyTo, subject y text. Captura cualquier error, lo registra con `console.error` y devuelve `status: "error"`.
7. Crear `components/about/contact-form.tsx` (Client Component): `useActionState(sendContact, { status: "idle" })`, validación de vacíos con shake antes de enviar, campo honeypot oculto, botón deshabilitado con "▶  TRANSMITIENDO…" mientras `pending`, y render de los estados Idle / Éxito / Error con el terminal del template. "ENVIAR OTRO MENSAJE" vacía el formulario; "REINTENTAR" vuelve al formulario con `values`.
8. Sustituir el placeholder de `app/about/page.tsx` por `<ContactForm />`. Verificación manual con `.env.local` real: enviar un mensaje y recibirlo en `CONTACT_TO_EMAIL`.
9. Revisión visual con `/frontend-design` y el Playwright MCP: capturar `/about` y la vista Acerca de de `arcade-vault-standalone.html` a 1440px y 390px, en estados Idle y Éxito, y corregir diferencias.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en `/about`.
- [ ] `/about` muestra "ACERCA DE ARCADE VAULT", el párrafo de misión y 3 highlights con sus textos literales.
- [ ] El divisor muestra 24 píxeles animados.
- [ ] La sección de contacto muestra "CONTÁCTANOS", 3 tips y los campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE con sus placeholders.
- [ ] Al cargar `/about` el divisor y la sección de contacto están ocultos y aparecen al hacer scroll hasta ellos.
- [ ] Enviar con algún campo vacío hace shake y no genera ninguna petición a la Server Action.
- [ ] Enviar un correo con formato inválido (p. ej. `a@b`, saltando la validación del navegador) hace shake y conserva los datos.
- [ ] Enviar un mensaje de más de 2000 caracteres hace shake y no envía correo.
- [ ] Mientras se envía, el botón está deshabilitado y muestra "▶  TRANSMITIENDO…".
- [ ] Con variables de entorno válidas, un envío correcto muestra el terminal con "GRACIAS, <NOMBRE>." y el correo llega a `CONTACT_TO_EMAIL` con el asunto `[Arcade Vault] Mensaje de <nombre>`.
- [ ] Responder al correo recibido dirige la respuesta al email introducido en el formulario.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario vacío.
- [ ] Sin `RESEND_API_KEY` definida, enviar muestra el terminal con líneas `[ERR]` y el error aparece en el log del servidor.
- [ ] "REINTENTAR" vuelve al formulario con los datos introducidos.
- [ ] Un envío con el campo `website` relleno muestra éxito y no envía correo.
- [ ] `RESEND_API_KEY` no aparece en ningún archivo de `.next/static`.
- [ ] `.env.template` existe y `.env.local` no está versionado.
- [ ] La nav muestra "Inicio", "Biblioteca", "Salón de la Fama" y "Acerca de", en ese orden, en la barra y en el panel móvil.
- [ ] "Acerca de" está activo sólo en `/about`.
- [ ] A 1440px los highlights se ven en 3 columnas y el contacto en 2 columnas; a 390px ambos se ven en 1 columna.
- [ ] Las capturas de Playwright de `/about` a 1440px y 390px coinciden con las del template en orden de secciones, textos, colores y distribución.

## Decisiones

- **Sí:** ruta `/about`. Sigue el criterio de rutas en inglés de `/games`.
- **No:** `/acerca`. Mezclaría más idiomas en las rutas nuevas.
- **Sí:** enlace "Acerca de" en la nav, después de "Salón de la Fama". Igual que `nav.jsx`.
- **Sí:** Server Action con `useActionState`. La API key nunca sale del servidor, no hay endpoint público y es el patrón de la guía de forms de Next.
- **No:** Route Handler en `app/api/contact/route.ts`. Más código y un endpoint expuesto.
- **Sí:** SDK oficial `resend`. API tipada y mantenida por Resend.
- **No:** `fetch` directo a la API REST. Hay que reescribir tipos y manejo de errores a mano.
- **Sí:** remitente `onboarding@resend.dev`. Funciona sin verificar dominio.
- **No:** dominio verificado propio. Va en otra spec; mientras tanto el correo sólo llega al dueño de la cuenta Resend.
- **Sí:** destinatario en `CONTACT_TO_EMAIL`. Cambiarlo no exige tocar código.
- **Sí:** `replyTo` con el correo del usuario. El equipo responde directamente desde su cliente.
- **Sí:** estado de carga en el botón y estado de error con el terminal en magenta. Coherente con la estética del template.
- **No:** mensaje de error inline o sólo shake. Rompe la metáfora del terminal o no explica qué ha pasado.
- **Sí:** validación en servidor a mano (vacíos, formato, longitudes). Tres campos no justifican una dependencia.
- **No:** zod. Dependencia nueva para tres reglas.
- **Sí:** honeypot `website` que finge éxito. Sin dependencias y sin cambio visual; el bot no sabe que ha sido filtrado.
- **No:** rate limit en memoria. No sobrevive a reinicios ni a varias instancias.
- **Sí:** correo en texto plano. Sin riesgo de inyectar HTML con el contenido del usuario.
- **No:** React Email. Más dependencias y superficie para un correo interno.
- **Sí:** reutilizar `RevealObserver` de `components/home/`. Ya hace exactamente lo que pide el template.
- **Sí:** componentes propios en `components/about/`. Mismo criterio que `components/home/` en SPEC 03.
- **Sí:** CSS del bloque `ABOUT PAGE` en `app/globals.css`. Mismo criterio que SPEC 01 y SPEC 03.
- **No:** email de confirmación al usuario, persistencia de mensajes ni tests automatizados. Excluidos explícitamente por el usuario.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Con `onboarding@resend.dev`, Resend rechaza destinatarios distintos al dueño de la cuenta | `CONTACT_TO_EMAIL` documentado como el email de la cuenta Resend. El fallo se ve como estado Error y en el log. |
| Faltan las variables de entorno en otro entorno (CI, despliegue) | La acción comprueba las variables antes de llamar a Resend y devuelve Error sin romper la página. `npm run build` no las necesita. |
| La API key acaba en el bundle del cliente | Variables sin `NEXT_PUBLIC_`, lectura sólo dentro de `lib/contact.ts` (`"use server"`). Criterio de aceptación sobre `.next/static`. |
| Abuso del formulario para enviar spam al equipo | Honeypot y límites de longitud. Rate limit queda para otra spec si hace falta. |
| El keyframe `shake` o `pxblink` choca con otro existente | Comprobar en el paso 1 que no existen en `app/globals.css` ni en Tailwind; si chocan, renombrar con prefijo `av-` como en SPEC 03. |
| El Playwright MCP no abre `file://` | Servir `references/templates/home-about/` con un servidor estático local, como en SPEC 03. |

## Qué **no** entra en esta spec

- Email de confirmación al usuario.
- Persistencia de los mensajes.
- Tests automatizados.
- Dominio verificado en Resend.
- Correo en HTML.
- Rate limiting o captcha.
- Cambios en el footer.

Cada uno de estos puntos, si llega, va en su propia spec.
