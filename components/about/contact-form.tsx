"use client";

import { startTransition, useActionState, useState } from "react";
import { sendContact, type ContactState, type ContactValues } from "@/lib/contact";

const INITIAL: ContactState = { status: "idle" };
const EMPTY: ContactValues = { name: "", email: "", msg: "" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContact, INITIAL);
  const [form, setForm] = useState<ContactValues>(EMPTY);
  const [shake, setShake] = useState(false);
  // Último resultado de la acción que el usuario ya ha atendido; cada respuesta es un objeto nuevo.
  const [seen, setSeen] = useState<ContactState>(INITIAL);

  const fresh = state !== seen;
  const shaking = shake || (fresh && state.status === "invalid");

  // Se envía desde el handler (no con `action`) para que React no resetee el formulario
  // y los vacíos se rechacen sin llegar a la Server Action.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true);
      return;
    }
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  const onAnimationEnd = (e: React.AnimationEvent<HTMLFormElement>) => {
    if (e.target !== e.currentTarget) return;
    setShake(false);
    if (state.status === "invalid") setSeen(state);
  };

  const sendAnother = () => {
    setSeen(state);
    setForm(EMPTY);
  };

  const retry = () => {
    setSeen(state);
    if (state.status === "error") setForm(state.values);
  };

  const result = fresh && (state.status === "sent" || state.status === "error") ? state : null;

  return (
    <form className={"contact-form" + (shaking ? " shake" : "")} onSubmit={onSubmit} onAnimationEnd={onAnimationEnd}>
      {!result ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input id="contact-name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="px_kai" />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input id="contact-email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jugador@vault.gg" />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea id="contact-msg" name="msg" rows={5} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Cuéntanos qué tienes en mente…"></textarea>
          </div>
          {/* Honeypot: invisible para personas, los bots lo rellenan */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
            <label htmlFor="contact-website">WEBSITE</label>
            <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "▶  TRANSMITIENDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body" aria-live="polite">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            {result.status === "sent" ? (
              <>
                <div className="line success">&gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {result.name.toUpperCase()}.<span className="caret">_</span></div>
                <div style={{ marginTop: 18 }}>
                  <button className="btn ghost" type="button" onClick={sendAnother}>ENVIAR OTRO MENSAJE</button>
                </div>
              </>
            ) : (
              <>
                <div className="line error">[ERR] Fallo en la transmisión.</div>
                <div className="line error">[ERR] EL MENSAJE NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO.<span className="caret">_</span></div>
                <div style={{ marginTop: 18 }}>
                  <button className="btn ghost" type="button" onClick={retry}>REINTENTAR</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
