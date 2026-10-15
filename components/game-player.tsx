"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import type { Game } from "@/lib/games";
import { appendScore } from "@/lib/session";
import { useSession } from "@/components/session-provider";

type Run = { score: number; lives: number; level: number; paused: boolean; over: boolean; saved: boolean };
type RunAction = { type: "tick"; points: number } | { type: "togglePause" } | { type: "end" } | { type: "saved" } | { type: "restart" };

const NEW_RUN: Run = { score: 0, lives: 3, level: 1, paused: false, over: false, saved: false };

function runReducer(run: Run, action: RunAction): Run {
  switch (action.type) {
    case "tick": {
      const score = run.score + action.points;
      // Same rule as the template: level up when the score lands just past a multiple of 2500.
      const level = score % 2500 < 100 ? run.level + 1 : run.level;
      return { ...run, score, level };
    }
    case "togglePause":
      return { ...run, paused: !run.paused };
    case "end":
      return { ...run, over: true };
    case "saved":
      return { ...run, saved: true };
    case "restart":
      return NEW_RUN;
  }
}

export function GamePlayer({ game }: { game: Game }) {
  const { user } = useSession();
  const [run, dispatch] = useReducer(runReducer, NEW_RUN);
  // null until the player edits it, so the session name shows once it loads.
  const [editedName, setEditedName] = useState<string | null>(null);
  const name = editedName ?? user?.name ?? "INVITADO";

  useEffect(() => {
    if (run.over || run.paused) return;
    const t = setInterval(() => dispatch({ type: "tick", points: Math.floor(10 + Math.random() * 90) }), 220);
    return () => clearInterval(t);
  }, [run.over, run.paused]);

  const saveScore = () => {
    appendScore({ game: game.id, score: run.score, name });
    dispatch({ type: "saved" });
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="flex flex-wrap gap-6">
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v text-ink!">{name}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{run.score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(run.lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(run.level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => dispatch({ type: "togglePause" })}>
            {run.paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={() => dispatch({ type: "end" })}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
          {run.paused && (
            <div className="crt-content z-5 bg-black/60">
              <div>
                <div className="pixel neon-yellow text-[22px]">EN PAUSA</div>
                <div className="mono mt-2.5 text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {run.over && (
        <div className="modal-bd">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
            <h2 id="game-over-title">FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{run.score.toLocaleString("es-ES")}</div>
            {!run.saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setEditedName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                  aria-label="Tus iniciales"
                />
                <button className="btn yellow" onClick={saveScore}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={() => dispatch({ type: "restart" })}>
                JUGAR DE NUEVO
              </button>
              <Link href="/" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
