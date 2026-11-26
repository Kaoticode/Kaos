"use client";
/*
 * KaosSeason · temáticas de temporada comunes de Kaoticode (familia Kaos).
 *
 * Una línea en el layout raíz y la web se viste sola según la fecha (hora de
 * España). Pensado para que se note sin agobiar:
 *  - Lo fijo (siempre): guirnalda arriba, luz ambiente del color de la
 *    temporada y borde en las tarjetas con `k-season-glow`.
 *  - Lo que se mueve: nieve, corazones y confeti caen suaves; murciélagos y
 *    fuegos artificiales solo ~9 s al entrar, una vez por visita.
 *  - Nada se mueve en zonas de trabajo (carrito, pago, cuenta, admin…) ni con
 *    «reducir movimiento», y nada captura clics.
 *
 *   Halloween     15 oct – 1 nov   murciélagos volando por la pantalla
 *   Navidad       1 dic – 6 ene    nieve
 *   Nochevieja    31 dic – 1 ene   fuegos artificiales
 *   San Valentín  1 – 14 feb       corazones
 *   Carnaval      sáb – mar de Carnaval (según la Pascua)   confeti
 *   Black Friday  lunes – Cyber Monday (solo tiendas)       franja
 *
 * Además pone `data-kaos-season` en <html> y los colores --k-season-1/2:
 * cualquier tarjeta con la clase `k-season-glow` coge el borde de temporada.
 *
 * Para verlo fuera de fecha: ?kaos-season=halloween (navidad, nochevieja,
 * sanvalentin, carnaval, blackfriday, off).
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type KaosSeasonId =
  | "halloween"
  | "navidad"
  | "nochevieja"
  | "sanvalentin"
  | "carnaval"
  | "blackfriday";

export const KAOS_SEASONS: Record<KaosSeasonId, { label: string }> = {
  halloween: { label: "Feliz Halloween" },
  navidad: { label: "Feliz Navidad" },
  nochevieja: { label: "Feliz Año Nuevo" },
  sanvalentin: { label: "Feliz San Valentín" },
  carnaval: { label: "¡Carnaval!" },
  blackfriday: { label: "Black Friday" },
};

const DAY = 86_400_000;

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher), en UTC. */
function easter(year: number): number {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(year, month - 1, day);
}

/** Viernes negro: el día después del cuarto jueves de noviembre. */
function blackFriday(year: number): number {
  const nov1 = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const firstThursday = 1 + ((4 - nov1 + 7) % 7);
  return Date.UTC(year, 10, firstThursday + 22);
}

/** Temporada de una fecha (en hora de España); null fuera de temporada. */
export function kaosSeasonFor(date = new Date()): KaosSeasonId | null {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-")
    .map(Number);
  const md = m * 100 + d;
  const day = Date.UTC(y, m - 1, d);
  if (md === 1231 || md === 101) return "nochevieja";
  if (md >= 1201 || md <= 106) return "navidad";
  if (md >= 1015 && md <= 1101) return "halloween";
  // Carnaval antes que San Valentín: a veces coinciden y dura solo 4 días.
  const carnivalTuesday = easter(y) - 47 * DAY;
  if (day >= carnivalTuesday - 3 * DAY && day <= carnivalTuesday) return "carnaval";
  if (md >= 201 && md <= 214) return "sanvalentin";
  const bf = blackFriday(y);
  if (day >= bf - 4 * DAY && day <= bf + 3 * DAY) return "blackfriday";
  return null;
}

const DEFAULT_SEASONS: KaosSeasonId[] = [
  "halloween",
  "navidad",
  "nochevieja",
  "sanvalentin",
  "carnaval",
];

const isSeason = (v: string | null): v is KaosSeasonId => !!v && v in KAOS_SEASONS;

export interface KaosSeasonProps {
  /** Fuerza una temporada (o "off" para apagarla en esta web). */
  season?: KaosSeasonId | "off";
  /** Temporadas que celebra esta web. Por defecto todas menos Black Friday (tiendas). */
  seasons?: KaosSeasonId[];
  /** Franja fina de color arriba del todo. Por defecto, sí. */
  ribbon?: boolean;
  /** Animación (murciélagos, nieve…). Por defecto, sí. */
  particles?: boolean;
  /** Rutas (prefijos) sin animación: se queda solo lo fijo. */
  quiet?: string[];
}

/** Zonas de trabajo: carrito, pago, cuenta, admin y accesos. */
export const KAOS_SEASON_QUIET = [
  "/admin",
  "/cart",
  "/guest-cart",
  "/checkout",
  "/pay",
  "/payment",
  "/order",
  "/user",
  "/account",
  "/cuenta",
  "/profile",
  "/perfil",
  "/settings",
  "/signin",
  "/signup",
  "/login",
  "/register",
  "/dashboard",
  "/panel",
];

const isQuietPath = (path: string, quiet: string[]) =>
  quiet.some((p) => path === p || path.startsWith(`${p}/`));

/** Ruta actual sin depender del router de cada web (se mira cada segundo). */
function usePath(): string {
  const [path, setPath] = useState("");
  useEffect(() => {
    const read = () => setPath(window.location.pathname);
    read();
    const id = window.setInterval(read, 800);
    window.addEventListener("popstate", read);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("popstate", read);
    };
  }, []);
  return path;
}

/** Las animaciones de entrada (murciélagos, fuegos) salen una vez por visita. */
function introSeen(id: KaosSeasonId): boolean {
  try {
    return window.sessionStorage.getItem(`kaos-season-intro:${id}`) === "1";
  } catch {
    return false;
  }
}

function markIntro(id: KaosSeasonId): void {
  try {
    window.sessionStorage.setItem(`kaos-season-intro:${id}`, "1");
  } catch {
    /* sin almacenamiento: saldrá en cada carga, sin más */
  }
}

export default function KaosSeason({
  season,
  seasons = DEFAULT_SEASONS,
  ribbon = true,
  particles = true,
  quiet = KAOS_SEASON_QUIET,
}: KaosSeasonProps): React.ReactNode {
  const [active, setActive] = useState<KaosSeasonId | null>(null);
  const [calm, setCalm] = useState(false);
  const [forcedIntro, setForcedIntro] = useState(false);
  const [intro, setIntro] = useState<"pending" | "playing" | "done">("pending");
  const path = usePath();
  const endIntro = useCallback(() => setIntro("done"), []);
  const seasonsKey = seasons.join();

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("kaos-season");
    let id: KaosSeasonId | null;
    if (forced === "off" || season === "off") id = null;
    else if (isSeason(forced)) id = forced;
    else if (season) id = season;
    else {
      const auto = kaosSeasonFor();
      id = auto && seasonsKey.split(",").includes(auto) ? auto : null;
    }
    setActive(id);
    setForcedIntro(isSeason(forced));
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const root = document.documentElement;
    if (id) root.dataset.kaosSeason = id;
    else delete root.dataset.kaosSeason;
    return () => {
      delete root.dataset.kaosSeason;
    };
  }, [season, seasonsKey]);

  const hasIntro = active === "halloween" || active === "nochevieja";
  const quietHere = !path || isQuietPath(path, quiet);

  // La entrada arranca en la primera página «normal» de la visita.
  useEffect(() => {
    if (!active || !hasIntro || intro !== "pending" || quietHere || calm || !particles) return;
    if (!forcedIntro && introSeen(active)) {
      setIntro("done");
      return;
    }
    markIntro(active);
    setIntro("playing");
  }, [active, hasIntro, intro, quietHere, calm, particles, forcedIntro]);

  if (!active) return null;
  const motion = particles && !calm && !quietHere;

  return (
    <>
      {ribbon && <Garland season={active} />}
      <div className={`k-season-ambient k-season-ambient--${active}`} aria-hidden />
      {intro === "playing" && active === "halloween" && <Bats onDone={endIntro} />}
      {intro === "playing" && active === "nochevieja" && <Fireworks onDone={endIntro} />}
      {motion && active === "navidad" && <Falling kind="snow" count={28} />}
      {motion && active === "sanvalentin" && <Falling kind="heart" count={12} />}
      {motion && active === "carnaval" && <Falling kind="confetti" count={22} />}
      {motion && active === "nochevieja" && <Falling kind="confetti" count={10} />}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Guirnalda fija arriba: banderines, luces o corazones según la fecha.     */
/* ---------------------------------------------------------------------- */
const GARLAND: Record<KaosSeasonId, { kind: "flag" | "bulb" | "heart"; colors: string[] }> = {
  halloween: { kind: "flag", colors: ["#ff7a1a", "#9b4dff", "#7ed957", "#9b4dff"] },
  navidad: { kind: "bulb", colors: ["#ff3b4e", "#ffd23f", "#2ecc71", "#4da3ff", "#ff9f1c"] },
  nochevieja: { kind: "flag", colors: ["#ffd23f", "#f4f1e8", "#c9a227", "#b8bcc6"] },
  sanvalentin: { kind: "heart", colors: ["#ff4f86", "#ff8fb1", "#c2185b"] },
  carnaval: { kind: "flag", colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#b76cfd"] },
  blackfriday: { kind: "flag", colors: ["#ffd400", "#111"] },
};

function Garland({ season }: { season: KaosSeasonId }) {
  const { kind, colors } = GARLAND[season];
  return (
    <div
      className={`k-season-garland k-season-garland--${kind}`}
      title={KAOS_SEASONS[season].label}
      aria-hidden
    >
      {Array.from({ length: 90 }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: adornos fijos
          key={i}
          style={
            {
              "--k-c": colors[i % colors.length],
              animationDelay: `${-((i * 0.37) % 3)}s`,
            } as React.CSSProperties
          }
        >
          {kind === "heart" ? "♥" : null}
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Caída suave (nieve, corazones, confeti): solo CSS, posiciones fijas.    */
/* ---------------------------------------------------------------------- */
const CONFETTI = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff9f1c", "#b76cfd", "#00c2a8"];

function Falling({ kind, count }: { kind: "snow" | "heart" | "confetti"; count: number }) {
  return (
    <div className={`k-season k-season--${kind}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const style = {
          left: `${(i * 37 + 11) % 100}%`,
          animationDelay: `${-((i * 1.9) % 14)}s`,
          animationDuration: `${(kind === "snow" ? 10 : 12) + ((i * 7) % 9)}s`,
          "--k-s": `${0.6 + ((i * 13) % 10) / 12}`,
          "--k-c": CONFETTI[i % CONFETTI.length],
          "--k-sway": `${((i * 29) % 60) - 30}px`,
        } as React.CSSProperties;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: partículas decorativas fijas
          <span key={i} className="k-season__p" style={style}>
            {kind === "heart" ? "♥" : null}
          </span>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Halloween: murciélagos que revolotean por la pantalla.                  */
/* ---------------------------------------------------------------------- */
const BAT_PATH =
  "M32 14c-2-4-4-5-6-5 1 2 1 3 0 4-3-3-8-5-14-4 4 2 6 5 6 8-3-2-7-2-10 0 5 1 9 4 11 9 3-3 7-4 10-3l3 4 3-4c3-1 7 0 10 3 2-5 6-8 11-9-3-2-7-2-10 0 0-3 2-6 6-8-6-1-11 1-14 4-1-1-1-2 0-4-2 0-4 1-6 5z";

/** Revolotean ~9 s y se marchan volando fuera de la pantalla. */
function Bats({ amount = 7, stay = 9000, onDone }: { amount?: number; stay?: number; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const els = Array.from(box.children) as HTMLElement[];
    let w = window.innerWidth;
    let h = window.innerHeight;
    const W = 48;
    const H = 26;
    const bats = els.map((el) => ({
      el,
      x: Math.random() * w,
      y: Math.random() * h * 0.7,
      tx: Math.random() * w,
      ty: Math.random() * h,
      dx: 0,
      dy: 0,
      timer: 0.5 + Math.random() * 1.5,
    }));
    let last = performance.now();
    const start = last;
    let leaving = false;
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!leaving && now - start > stay) {
        leaving = true;
        // Cada uno se va por el lado que tiene más cerca (o por arriba).
        for (const b of bats) {
          const toLeft = b.x < w / 2;
          b.tx = toLeft ? -W * 4 : w + W * 4;
          b.ty = b.y < h / 2 ? -H * 6 : b.y;
          b.timer = 99;
        }
      }
      let inside = 0;
      for (const b of bats) {
        const lx = b.tx - b.x;
        const ly = b.ty - b.y;
        const len = Math.max(1, Math.hypot(lx, ly));
        b.dx += ((7 * lx) / len - b.dx) * dt * 1.8;
        b.dy += ((7 * ly) / len - b.dy) * dt * 1.8;
        const speed = leaving ? 45 : 25;
        b.x += b.dx * dt * speed;
        b.y += b.dy * dt * speed;
        if (!leaving) {
          b.x = Math.max(-W, Math.min(w, b.x));
          b.y = Math.max(-H, Math.min(h, b.y));
        }
        if (b.x > -W * 2 && b.x < w + W && b.y > -H * 3 && b.y < h + H) inside++;
        b.timer -= dt;
        if (!leaving && b.timer < 0) {
          b.tx = Math.random() * w;
          b.ty = Math.random() * h;
          b.timer = 1 + Math.random() * 2;
        }
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) scaleX(${b.dx < 0 ? -1 : 1})`;
      }
      if (leaving && inside === 0) {
        onDone();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [stay, onDone]);

  return (
    <div ref={ref} className="k-season k-season--bats" aria-hidden>
      {Array.from({ length: amount }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: murciélagos decorativos fijos
        <span key={i} className="k-season__bat">
          <svg viewBox="0 0 64 32" style={{ animationDelay: `${-i * 0.07}s` }}>
            <path d={BAT_PATH} />
          </svg>
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Nochevieja: unos pocos fuegos artificiales, de vez en cuando.          */
/* ---------------------------------------------------------------------- */
/** Unas cuantas tracas al entrar (~9 s) y fuera. */
function Fireworks({ stay = 9000, onDone }: { stay?: number; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    type P = { x: number; y: number; vx: number; vy: number; a: number; c: string };
    let parts: P[] = [];
    const burst = () => {
      if (document.hidden) return;
      const x = window.innerWidth * (0.15 + Math.random() * 0.7);
      const y = window.innerHeight * (0.12 + Math.random() * 0.35);
      const c = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
      for (let i = 0; i < 46; i++) {
        const ang = (i / 46) * Math.PI * 2;
        const sp = 1.5 + Math.random() * 2.5;
        parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, a: 1, c });
      }
    };
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (now - start > stay && parts.length === 0) {
        onDone();
        return;
      }
      parts = parts.filter((p) => p.a > 0.02);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;
        p.vx *= 0.985;
        p.a -= 0.012;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    burst();
    const timer = window.setInterval(() => {
      if (performance.now() - start < stay - 1500) burst();
    }, 1800);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
      window.removeEventListener("resize", resize);
    };
  }, [stay, onDone]);

  return <canvas ref={ref} className="k-season k-season--fireworks" aria-hidden />;
}
