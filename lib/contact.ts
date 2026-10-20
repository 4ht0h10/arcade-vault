"use server";

import { Resend } from "resend";

export type ContactValues = { name: string; email: string; msg: string };

export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; values: ContactValues }
  | { status: "error"; values: ContactValues }
  | { status: "sent"; name: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValid({ name, email, msg }: ContactValues) {
  const n = name.trim();
  const e = email.trim();
  const m = msg.trim();
  return (
    n.length > 0 && n.length <= 60 &&
    e.length > 0 && e.length <= 120 && EMAIL_RE.test(e) &&
    m.length > 0 && m.length <= 2000
  );
}

// Server Action del formulario de contacto: honeypot → validación → env → Resend.
export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values: ContactValues = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    msg: String(formData.get("msg") ?? ""),
  };

  // Un bot que rellena el campo oculto recibe un éxito falso y no se envía nada.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "sent", name: values.name.trim() };
  }

  if (!isValid(values)) return { status: "invalid", values };

  const name = values.name.trim();
  const email = values.email.trim();
  const msg = values.msg.trim();

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !to) throw new Error("Faltan RESEND_API_KEY o CONTACT_TO_EMAIL");

    const { error } = await new Resend(apiKey).emails.send({
      from: "Arcade Vault <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`,
    });
    if (error) throw new Error(`Resend: ${error.name} — ${error.message}`);

    return { status: "sent", name };
  } catch (err) {
    console.error("[contact] No se pudo enviar el mensaje:", err);
    return { status: "error", values };
  }
}
