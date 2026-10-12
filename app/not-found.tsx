import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in mx-auto flex max-w-[560px] flex-col items-center px-5 pt-12 pb-20 text-center">
      <div className="crt w-full">
        <div className="crt-screen">
          <div className="crt-content flex-col gap-4">
            <div className="pixel neon-magenta flicker text-[clamp(56px,14vw,96px)] motion-reduce:animate-none!">
              404
            </div>
            <div className="pixel neon-yellow text-[10px] tracking-[0.2em]">
              SEÑAL PERDIDA <span className="blink motion-reduce:animate-none!">_</span>
            </div>
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">SIN SEÑAL</span>
          <span>CANAL 404</span>
        </div>
      </div>

      <h1 className="pixel neon-cyan mt-10 mb-0 text-[clamp(14px,2.4vw,18px)] tracking-[0.08em]">
        Esta pantalla no existe
      </h1>
      <p className="mt-4 mb-0 max-w-[44ch] text-ink-dim">
        La dirección no corresponde a ningún juego ni sección del vault. Vuelve a la biblioteca para elegir
        otro juego.
      </p>
      <Link href="/" className="btn lg mt-8">
        VOLVER AL VAULT
      </Link>
    </div>
  );
}
