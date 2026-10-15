"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/session-provider";

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);

  const isLibrary = pathname === "/" || pathname.startsWith("/juegos/");
  const isHall = pathname === "/salon";
  const isAuth = pathname === "/login";
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={isLibrary ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon" className={isHall ? "active" : ""}>
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={logout}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/login" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan mb-4 text-[11px]">MENÚ</div>
        <Link href="/" className={isLibrary ? "active" : ""} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={isHall ? "active" : ""} onClick={close}>
          Salón de la Fama
        </Link>
        <Link href="/login" className={isAuth ? "active" : ""} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        {/* The bar hides its session button on phones, so sign-out must be reachable here */}
        {user && (
          <button
            className="panel-item"
            onClick={() => {
              logout();
              close();
            }}
          >
            Cerrar sesión ({user.name})
          </button>
        )}
        <div className="flex-1"></div>
        <div className="pixel text-[9px] tracking-[0.16em] text-ink-faint">CRÉDITOS · 03</div>
      </aside>
    </>
  );
}
