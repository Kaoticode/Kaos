/*
 * KaosApps · las apps de Kaoticode (familia Kaos, ver DESIGN.md).
 *
 * Todas las webs copian este archivo TAL CUAL. Los iconos van en
 * public/kaos/apps/<id>.png (también copiados tal cual).
 *
 * La cuenta y la suscripción son de Kaoticode (Kaoticode ID): valen en todas
 * estas apps. Komunly es una app más del ecosistema.
 */

export interface KaosApp {
  id: string;
  name: string;
  url: string;
  /** Color de la marca (el accent de su web). */
  color: string;
  /** Qué es, en dos o tres palabras. */
  tagline: string;
  /** Tiene su propio acceso (no la cuenta de Kaoticode): no sale en el pasaporte. */
  ownLogin?: boolean;
}

export const KAOS_APPS: KaosApp[] = [
  {
    id: "komunly",
    name: "Komunly",
    url: "https://www.komunly.com",
    color: "#a3e635",
    tagline: "Red social",
  },
  {
    id: "lakancha",
    name: "LaKancha",
    url: "https://lakancha.app",
    color: "#00c048",
    tagline: "Fútbol sala",
  },
  {
    id: "kallate",
    name: "Kallate",
    url: "https://kallate.app",
    color: "#fd7316",
    tagline: "Sonidos y ASMR",
  },
  {
    id: "infoodmacion",
    name: "Infoodmación",
    url: "https://www.infoodmacion.com",
    color: "#f09018",
    tagline: "Fitness y nutrición",
  },
  {
    id: "klickum",
    name: "Klickum",
    url: "https://www.klickum.com",
    color: "#90c030",
    tagline: "Tienda y rifas",
  },
  {
    id: "kompetencia",
    name: "Kompetencia",
    url: "https://kompetencia.app",
    color: "#d81818",
    tagline: "Minijuegos",
  },
  {
    id: "kostumbres",
    name: "Kostumbres",
    url: "https://kostumbres.com",
    color: "#34d399",
    tagline: "Hábitos",
  },
  {
    id: "kaoticlub",
    name: "Kaoticlub",
    url: "https://kaoticlub.com",
    color: "#e61f5c",
    tagline: "Eventos",
  },
  {
    id: "respetao",
    name: "Respetao",
    url: "https://respetao.com",
    color: "#f0c040",
    tagline: "Moda",
  },
  {
    id: "lakarta",
    name: "Lakarta",
    url: "https://lakarta.app",
    color: "#e0482b",
    tagline: "Carta y pedidos",
    ownLogin: true,
  },
];

/** La empresa: la cuenta, la suscripción, lo legal y los patrocinios son suyos. */
export const KAOTICODE = {
  name: "Kaoticode",
  url: "https://www.kaoticode.com",
  color: "#2f7bff",
  /** Hazte patrocinador de cualquier app. */
  sponsorUrl: "https://www.kaoticode.com/patrocinadores",
  legalUrl: "https://www.kaoticode.com/terminos-y-condiciones",
  privacyUrl: "https://www.kaoticode.com/terminos-y-condiciones/privacidad",
  cookiesUrl: "https://www.kaoticode.com/terminos-y-condiciones/cookies",
  contactUrl: "https://wa.me/+34614234850",
} as const;

/**
 * Los sellos del pasaporte (Kaoticode ID): Kaoticode y las apps que entran con
 * su cuenta (Lakarta no: tiene su propio acceso).
 */
export const KAOS_PASSPORT_APPS: KaosApp[] = [
  {
    id: "kaoticode",
    name: KAOTICODE.name,
    url: KAOTICODE.url,
    color: KAOTICODE.color,
    tagline: "La cuenta de todas",
  },
  ...KAOS_APPS.filter((app) => !app.ownLogin),
];

/** Ruta del icono de una app (con el basePath de la web, si tiene). */
export function kaosAppIcon(id: string, base = ""): string {
  return `${base}/kaos/apps/${id}.png`;
}
