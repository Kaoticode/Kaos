/*
 * KaosTopBar · la barra superior común de Kaoticode (familia Kaos, ver DESIGN.md).
 *
 * Todas las webs copian este archivo TAL CUAL; los estilos van en kaos.css
 * (clases k-brand*, k-topbar*). La marca es siempre la misma pieza: el icono de
 * la app (cuadrado con esquinas redondeadas) y el nombre en la letra de titulares.
 * A la derecha, uno junto al otro, carrito y entrar (o la cuenta).
 */
import type { ComponentType, ReactNode } from "react";

export interface KaosBrandInfo {
  /** Nombre de la web, tal cual se escribe («Kallate», «LaKancha»…). */
  name: string;
  /** Ruta pública del icono de la app (el mismo del PWA). */
  icon: string;
  /** Adónde lleva al tocarla (normalmente la portada). */
  href: string;
}

interface LinkProps {
  href: string;
  className: string;
  "aria-label"?: string;
  onClick?: () => void;
  children: ReactNode;
}

/** Enlace de la web: next/link tal cual, o un adaptador para react-router. */
export type KaosTopLink = ComponentType<LinkProps>;

/** Icono + nombre. La misma pieza arriba, en el panel del menú y donde haga falta. */
export function KaosBrand({
  brand,
  link: Link,
  size = "md",
  onClick,
}: {
  brand: KaosBrandInfo;
  link: KaosTopLink;
  size?: "sm" | "md";
  onClick?: () => void;
}): React.ReactElement {
  return (
    <Link
      href={brand.href}
      className={`k-brand k-brand--${size}`}
      aria-label={`${brand.name}, inicio`}
      onClick={onClick}
    >
      {/* biome-ignore lint/performance/noImgElement: icono pequeño de la marca, igual en todas las webs (también fuera de Next). */}
      <img className="k-brand__mark" src={brand.icon} alt="" aria-hidden />
      <span className="k-brand__name">{brand.name}</span>
    </Link>
  );
}

/** Botón redondo de la derecha (carrito, entrar…), con número opcional. */
export function KaosTopAction({
  label,
  icon,
  badge,
  href,
  link: Link,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  badge?: number;
  href?: string;
  link?: KaosTopLink;
  onClick?: () => void;
}): React.ReactElement {
  const content = (
    <>
      {icon}
      {!!badge && (
        <span className="k-topbar__badge" aria-hidden>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );
  const aria = badge ? `${label} (${badge})` : label;
  if (href && Link) {
    return (
      <Link href={href} className="k-topbar__action" aria-label={aria}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="k-topbar__action"
      aria-label={aria}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

/** La cara de la cuenta: su foto o, si no tiene, la inicial. Solo la foto, sin nombre. */
export function KaosAvatar({
  photo,
  name,
}: {
  photo?: string | null;
  name: string;
}): React.ReactElement {
  if (photo) {
    // biome-ignore lint/performance/noImgElement: foto pequeña de la cuenta, igual en todas las webs (también fuera de Next).
    return <img className="k-topbar__avatar" src={photo} alt="" />;
  }
  return (
    <span className="k-topbar__initial" aria-hidden>
      {name.trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

/** La cuenta arriba a la derecha (con sesión): solo la foto, redonda. */
export function KaosTopAccount({
  photo,
  name,
  href,
  link: Link,
}: {
  photo?: string | null;
  name: string;
  href: string;
  link: KaosTopLink;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="k-topbar__account"
      aria-label={`Tu cuenta (${name})`}
    >
      <KaosAvatar photo={photo} name={name} />
    </Link>
  );
}

/**
 * Barra superior común: marca a la izquierda y acciones a la derecha.
 * Por defecto solo en el móvil (hasta 768 px); `desktop` la deja siempre.
 */
export default function KaosTopBar({
  brand,
  link,
  actions,
  desktop = false,
}: {
  brand: KaosBrandInfo;
  link: KaosTopLink;
  actions?: ReactNode;
  desktop?: boolean;
}): React.ReactElement {
  return (
    <header className={`k-topbar ${desktop ? "k-topbar--desktop" : ""}`}>
      <KaosBrand brand={brand} link={link} />
      {actions && <div className="k-topbar__actions">{actions}</div>}
    </header>
  );
}
