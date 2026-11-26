/*
 * KaosSponsors · los patrocinadores, iguales en todas las webs de Kaoticode
 * (familia Kaos, ver DESIGN.md).
 *
 * Todas las webs copian este archivo TAL CUAL; los estilos van en kaos.css
 * (clases k-sponsors*). Los patrocinadores se gestionan en el panel de
 * Kaoticode y salen de su API (GET /sponsors?app=<app>). Cada web los pide
 * como le venga bien (en el servidor o en el navegador) con fetchKaosSponsors
 * y se los pasa a estas piezas, que solo pintan.
 */
import { ArrowUpRight, Handshake } from "lucide-react";
import { KAOTICODE } from "./KaosApps";
import KaosSponsorImpression, {
  KaosSponsorLink,
} from "./KaosSponsorImpression";

export interface KaosSponsor {
  id: string;
  name: string;
  logo: string;
  /** Enlace /go de la API: apunta el click y lleva a la web del patrocinador. */
  url: string;
  description?: string;
}

/** La API de Kaoticode (la misma que usa Komunly). */
export const KAOS_SPONSORS_API = "https://komunly.kaoticode.dev";

interface ApiSponsor {
  id?: string;
  name?: string;
  description?: string | null;
  imageUrl?: string;
  link?: string;
}

/** De la respuesta de la API a la lista que pintan las piezas (descarta los incompletos). */
export function toKaosSponsors(data: unknown): KaosSponsor[] {
  if (!Array.isArray(data)) return [];
  return (data as ApiSponsor[])
    .filter((s) => s.id && s.name && s.imageUrl && s.link)
    .map((s) => ({
      id: s.id as string,
      name: s.name as string,
      logo: s.imageUrl as string,
      url: s.link as string,
      ...(s.description ? { description: s.description } : {}),
    }));
}

/**
 * Pide los patrocinadores de una app. Si la API no responde, lista vacía (no
 * se pinta nada). `init` permite el `next: { revalidate }` de Next.
 */
export async function fetchKaosSponsors(
  app: string,
  {
    api = KAOS_SPONSORS_API,
    ...init
  }: RequestInit & { api?: string; next?: { revalidate?: number } } = {},
): Promise<KaosSponsor[]> {
  try {
    const res = await fetch(
      `${api.replace(/\/+$/, "")}/sponsors?app=${encodeURIComponent(app)}`,
      {
        signal: AbortSignal.timeout(4000),
        ...init,
      },
    );
    if (!res.ok) return [];
    return toKaosSponsors(await res.json());
  } catch {
    return [];
  }
}

/** Franja de logos encima del pie de página. Sin patrocinadores, no se pinta. */
export function KaosSponsorsStrip({
  sponsors,
  app,
  api,
  href = "/patrocinadores",
}: {
  sponsors: KaosSponsor[];
  /** Código de la app (para apuntar las impresiones). */
  app: string;
  api?: string;
  /** La página de patrocinadores de la web («Ver todos»); null para no enlazarla. */
  href?: string | null;
}): React.ReactElement | null {
  if (sponsors.length === 0) return null;
  return (
    <section className="k-sponsors-strip" aria-label="Patrocinadores">
      <p className="k-sponsors-strip__title">
        Patrocinadores
        {href && (
          <a className="k-sponsors-strip__all" href={href}>
            Ver todos
          </a>
        )}
      </p>
      <ul className="k-sponsors-strip__list">
        {sponsors.map((s) => (
          <li key={s.id}>
            <KaosSponsorLink
              className="k-sponsors-strip__item"
              href={s.url}
              title={s.description || s.name}
            >
              {/* biome-ignore lint/performance/noImgElement: logos remotos de cualquier dominio, iguales en todas las webs. */}
              <img src={s.logo} alt={s.name} loading="lazy" />
            </KaosSponsorLink>
          </li>
        ))}
      </ul>
      <KaosSponsorImpression
        ids={sponsors.map((s) => s.id)}
        app={app}
        api={api}
      />
    </section>
  );
}

/** Tarjetas de patrocinadores (logo, nombre, qué hacen y «Visitar»). */
export function KaosSponsorsGrid({
  sponsors,
  app,
  api,
}: {
  sponsors: KaosSponsor[];
  app: string;
  api?: string;
}): React.ReactElement {
  return (
    <>
      <ul className="k-sponsors__grid">
        {sponsors.map((s) => (
          <li key={s.id}>
            <KaosSponsorLink className="k-sponsors__card" href={s.url}>
              <span className="k-sponsors__logo">
                {/* biome-ignore lint/performance/noImgElement: logos remotos de cualquier dominio, iguales en todas las webs. */}
                <img src={s.logo} alt="" loading="lazy" />
              </span>
              <span className="k-sponsors__body">
                <span className="k-sponsors__name">{s.name}</span>
                {s.description && (
                  <span className="k-sponsors__description">
                    {s.description}
                  </span>
                )}
                <span className="k-sponsors__visit">
                  Visitar <ArrowUpRight size={14} aria-hidden />
                </span>
              </span>
            </KaosSponsorLink>
          </li>
        ))}
      </ul>
      <KaosSponsorImpression
        ids={sponsors.map((s) => s.id)}
        app={app}
        api={api}
      />
    </>
  );
}

/**
 * La página de patrocinadores, igual en todas las webs: cabecera, las
 * tarjetas (o un aviso si no hay) y el «¿Quieres patrocinar…?» de Kaoticode.
 * `status` sirve a las webs que los cargan en el navegador.
 */
export function KaosSponsorsPage({
  appName,
  sponsors,
  app,
  api,
  status = "ready",
  onRetry,
  children,
}: {
  appName: string;
  sponsors: KaosSponsor[];
  app: string;
  api?: string;
  status?: "loading" | "ready" | "error";
  onRetry?: () => void;
  /** Algo propio de la web debajo de las tarjetas (opcional). */
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="k-sponsors">
      <header className="k-sponsors__header">
        <span className="k-sponsors__icon" aria-hidden>
          <Handshake size={26} />
        </span>
        <h1 className="k-sponsors__title">Gracias a nuestros patrocinadores</h1>
        <p className="k-sponsors__text">
          Ellos hacen posible que {appName} siga creciendo. Si te gusta lo que
          hacen, pásate a conocerlos.
        </p>
      </header>

      {status === "loading" ? (
        <div className="k-sponsors__state">
          <span className="k-sponsors__spinner" aria-hidden />
          Cargando patrocinadores…
        </div>
      ) : sponsors.length > 0 ? (
        <KaosSponsorsGrid sponsors={sponsors} app={app} api={api} />
      ) : (
        <div className="k-sponsors__state">
          {status === "error"
            ? "No se han podido cargar los patrocinadores."
            : "Ahora mismo no hay patrocinadores."}
          {status === "error" && onRetry && (
            <button
              type="button"
              className="k-btn k-btn--ghost"
              onClick={onRetry}
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {children}

      <a
        className="k-sponsors__cta"
        href={KAOTICODE.sponsorUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>
          <strong>¿Quieres patrocinar {appName}?</strong>
          <small>
            Llega a la gente de {appName} y del resto de apps de Kaoticode.
          </small>
        </span>
        <ArrowUpRight size={18} aria-hidden />
      </a>
    </div>
  );
}
