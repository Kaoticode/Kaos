/*
 * KaosFooter · el pie de página común de Kaoticode (familia Kaos, ver DESIGN.md).
 *
 * Todas las webs copian este archivo TAL CUAL; los estilos van en kaos.css
 * (clases k-footer*), con el acento de cada web. Mismo orden en todas: la franja
 * de patrocinadores, la marca, Enlaces, Información, Síguenos y, abajo del todo,
 * el resto de apps de Kaoticode.
 */
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { KAOS_APPS, KAOTICODE, kaosAppIcon } from "./KaosApps";
import { KaosBrand, type KaosBrandInfo, type KaosTopLink } from "./KaosTopBar";

export interface KaosFooterLink {
  label: string;
  href: string;
  /** Fuera de la web: se abre en otra pestaña. */
  external?: boolean;
}

export interface KaosSocials {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

const SOCIAL_ICONS: Record<keyof KaosSocials, { label: string; path: string }> =
  {
    instagram: {
      label: "Instagram",
      path: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z",
    },
    tiktok: {
      label: "TikTok",
      path: "M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    },
    youtube: {
      label: "YouTube",
      path: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z",
    },
    whatsapp: {
      label: "WhatsApp",
      path: "M.06 24l1.69-6.16a11.87 11.87 0 0 1-1.59-5.95C.16 5.34 5.5 0 12.05 0a11.82 11.82 0 0 1 8.41 3.49 11.82 11.82 0 0 1 3.48 8.41c0 6.56-5.34 11.89-11.89 11.89a11.9 11.9 0 0 1-5.69-1.45L.06 24zm6.6-3.81c1.67 1 3.27 1.59 5.39 1.59 5.45 0 9.89-4.43 9.89-9.88 0-5.46-4.42-9.89-9.88-9.89-5.45 0-9.89 4.43-9.89 9.88 0 2.23.65 3.89 1.75 5.64l-1 3.65 3.74-.99z",
    },
  };

function Item({
  item,
  link: Link,
}: {
  item: KaosFooterLink;
  link: KaosTopLink;
}): React.ReactElement {
  const content = (
    <>
      <ChevronRight className="k-footer__bullet" aria-hidden />
      {item.label}
    </>
  );
  if (item.external) {
    return (
      <a
        className="k-footer__link"
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }
  return (
    <Link className="k-footer__link" href={item.href}>
      {content}
    </Link>
  );
}

function Column({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <div className="k-footer__col">
      <p className="k-footer__heading">
        <span className="k-footer__bar" aria-hidden />
        {title}
      </p>
      {children}
    </div>
  );
}

/**
 * Pie de página común. `links` son los enlaces propios de la web; los de
 * patrocinio, lo legal y el contacto son de Kaoticode y salen solos.
 * `cookies` es el botón «Configurar cookies» de cada web (con la clase
 * k-footer__link); `sponsors`, su franja de patrocinadores (KaosSponsorsStrip).
 */
export default function KaosFooter({
  brand,
  description,
  link,
  links = [],
  socials = {},
  sponsors,
  cookies,
  sponsorsHref = "/patrocinadores",
  appId,
  assetBase = "",
  info: own = {},
  copy,
}: {
  brand: KaosBrandInfo;
  description: string;
  link: KaosTopLink;
  links?: KaosFooterLink[];
  socials?: KaosSocials;
  sponsors?: ReactNode;
  cookies?: ReactNode;
  /** La página de patrocinadores de la web (null si no tiene). */
  sponsorsHref?: string | null;
  /** id de esta web en KAOS_APPS (para no listarse a sí misma). */
  appId?: string;
  /** basePath de la web, si tiene (para los iconos). */
  assetBase?: string;
  /** Páginas propias de contacto y legales (si no, las de Kaoticode). */
  info?: Partial<Record<"contact" | "legal" | "privacy" | "terms", string>>;
  /** Línea final propia (p. ej. la tienda de un restaurante hecha con Lakarta). */
  copy?: ReactNode;
}): React.ReactElement {
  const enlaces: KaosFooterLink[] = [
    ...links,
    ...(sponsorsHref ? [{ label: "Patrocinadores", href: sponsorsHref }] : []),
    {
      label: "¿Quieres ser patrocinador?",
      href: KAOTICODE.sponsorUrl,
      external: true,
    },
  ];
  const ext = (href: string) => !href.startsWith("/");
  const contact = own.contact ?? "/contacto";
  const legal = own.legal ?? KAOTICODE.legalUrl;
  const privacy = own.privacy ?? KAOTICODE.privacyUrl;
  const terms = own.terms ?? KAOTICODE.legalUrl;
  const info: KaosFooterLink[] = [
    { label: "Contacto", href: contact, external: ext(contact) },
    { label: "Aviso legal", href: legal, external: ext(legal) },
    { label: "Política de privacidad", href: privacy, external: ext(privacy) },
    { label: "Términos de uso", href: terms, external: ext(terms) },
  ];
  const socialList = (
    Object.keys(SOCIAL_ICONS) as (keyof KaosSocials)[]
  ).filter((k) => socials[k]);
  const others = KAOS_APPS.filter((a) => a.id !== appId);

  return (
    <footer className="k-footer">
      {sponsors}
      <div className="k-footer__inner">
        <div className="k-footer__about">
          <KaosBrand brand={brand} link={link} />
          <p className="k-footer__text">{description}</p>
        </div>

        <Column title="Enlaces">
          <ul className="k-footer__list">
            {enlaces.map((item) => (
              <li key={item.label}>
                <Item item={item} link={link} />
              </li>
            ))}
          </ul>
        </Column>

        <Column title="Información">
          <ul className="k-footer__list">
            {info.map((item) => (
              <li key={item.label}>
                <Item item={item} link={link} />
              </li>
            ))}
            {cookies && <li>{cookies}</li>}
          </ul>
        </Column>

        {socialList.length > 0 && (
          <Column title="Síguenos">
            <div className="k-footer__socials">
              {socialList.map((k) => (
                <a
                  key={k}
                  className="k-footer__social"
                  href={socials[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" role="img">
                    <title>{SOCIAL_ICONS[k].label}</title>
                    <path d={SOCIAL_ICONS[k].path} />
                  </svg>
                </a>
              ))}
            </div>
          </Column>
        )}
      </div>

      <div className="k-footer__family">
        <p className="k-footer__family-title">Más apps de Kaoticode</p>
        <ul className="k-footer__apps">
          {others.map((app) => (
            <li key={app.id}>
              <a
                className="k-footer__app"
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${app.name} · ${app.tagline}`}
              >
                {/* biome-ignore lint/performance/noImgElement: iconos pequeños, iguales en todas las webs (también fuera de Next). */}
                <img
                  src={kaosAppIcon(app.id, assetBase)}
                  alt=""
                  loading="lazy"
                  width={28}
                  height={28}
                />
                <span>{app.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="k-footer__copy">
        {copy ?? (
          <>
            © {new Date().getFullYear()}{" "}
            {brand.name === KAOTICODE.name ? (
              "Kaoticode"
            ) : (
              <>
                {brand.name} es una app de{" "}
                <a
                  href={KAOTICODE.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Kaoticode
                </a>
              </>
            )}
            . Todos los derechos reservados.
          </>
        )}
      </p>
    </footer>
  );
}
