"use client";
/*
 * KaosSeason · temáticas de temporada comunes de Kaoticode (familia Kaos).
 *
 * Se pone una vez en el layout raíz de cada web y, según la fecha (hora de
 * España), viste la web: nieve en Navidad, murciélagos y calabazas en
 * Halloween, corazones en San Valentín y una franja en Black Friday (esta
 * solo en tiendas: pásale `seasons`).
 * Fuera de temporada no pinta nada. Estilos k-season* en kaos.css.
 *
 * Para verlo fuera de fecha: añade ?kaos-season=navidad (o halloween,
 * sanvalentin, blackfriday, off) a cualquier dirección.
 */
import { useEffect, useMemo, useState } from "react";

export type KaosSeasonId = "navidad" | "halloween" | "sanvalentin" | "blackfriday";

interface SeasonInfo {
  id: KaosSeasonId;
  /** Nombre de la temporada (título de la franja). */
  label: string;
  /** Caracteres que caen o flotan (vacío = solo franja). */
  particles: string[];
}

export const KAOS_SEASONS: Record<KaosSeasonId, SeasonInfo> = {
  navidad: { id: "navidad", label: "Feliz Navidad", particles: ["❄", "✦", "•", "❅"] },
  halloween: { id: "halloween", label: "Feliz Halloween", particles: ["🦇", "🎃", "👻", "✦"] },
  sanvalentin: { id: "sanvalentin", label: "Feliz San Valentín", particles: ["♥", "♡", "✦"] },
  blackfriday: { id: "blackfriday", label: "Black Friday", particles: [] },
};

/** Viernes negro: el cuarto jueves de noviembre + 1 día. */
function blackFriday(year: number): Date {
  const nov1 = new Date(Date.UTC(year, 10, 1));
  const firstThursday = 1 + ((4 - nov1.getUTCDay() + 7) % 7);
  return new Date(Date.UTC(year, 10, firstThursday + 21 + 1));
}

/** Temporada de una fecha (en hora de España); null fuera de temporada. */
export function kaosSeasonFor(date = new Date()): KaosSeasonId | null {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = parts.split("-").map(Number);
  const md = m * 100 + d;
  if (md >= 1201 || md <= 106) return "navidad";
  if (md >= 1024 && md <= 1101) return "halloween";
  if (md >= 207 && md <= 214) return "sanvalentin";
  // De lunes a Cyber Monday de la semana del Black Friday.
  const bf = blackFriday(y);
  const day = Date.UTC(y, m - 1, d);
  const diff = (day - bf.getTime()) / 86_400_000;
  if (diff >= -4 && diff <= 3) return "blackfriday";
  return null;
}

const isSeason = (v: string | null): v is KaosSeasonId =>
  !!v && v in KAOS_SEASONS;

const DEFAULT_SEASONS: KaosSeasonId[] = ["navidad", "halloween", "sanvalentin"];

export interface KaosSeasonProps {
  /** Fuerza una temporada (o "off" para apagarla en esta web). */
  season?: KaosSeasonId | "off";
  /**
   * Temporadas que esta web celebra por fecha. Por defecto todas menos
   * Black Friday, que solo tiene sentido en tiendas (Klickum, Lakarta…).
   */
  seasons?: KaosSeasonId[];
  /** Franja fina de color arriba del todo. Por defecto, sí. */
  ribbon?: boolean;
  /** Partículas animadas. Por defecto, sí (sin animación con reduced motion). */
  particles?: boolean;
}

export default function KaosSeason({
  season,
  seasons = DEFAULT_SEASONS,
  ribbon = true,
  particles = true,
}: KaosSeasonProps): React.ReactNode {
  const [active, setActive] = useState<KaosSeasonId | null>(null);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("kaos-season");
    let id: KaosSeasonId | null;
    if (forced === "off" || season === "off") id = null;
    else if (isSeason(forced)) id = forced;
    else if (season) id = season;
    else {
      const auto = kaosSeasonFor();
      id = auto && seasons.includes(auto) ? auto : null;
    }
    setActive(id);
    const root = document.documentElement;
    if (id) root.dataset.kaosSeason = id;
    else delete root.dataset.kaosSeason;
    return () => {
      delete root.dataset.kaosSeason;
    };
  }, [season, seasons.join()]);

  // Posiciones fijas por partícula (sin aleatoriedad en el render: nada salta).
  const drops = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: (i * 53) % 100,
        delay: -((i * 1.7) % 12),
        duration: 9 + ((i * 7) % 8),
        size: 0.7 + ((i * 13) % 10) / 10,
      })),
    [],
  );

  if (!active) return null;
  const info = KAOS_SEASONS[active];

  return (
    <>
      {ribbon && (
        <div
          className={`k-season-ribbon k-season-ribbon--${active}`}
          title={info.label}
          aria-hidden
        />
      )}
      {particles && info.particles.length > 0 && (
        <div className={`k-season k-season--${active}`} aria-hidden>
          {drops.map((p, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: partículas decorativas fijas
              key={i}
              className="k-season__p"
              style={
                {
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  fontSize: `${p.size}rem`,
                } as React.CSSProperties
              }
            >
              {info.particles[i % info.particles.length]}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
