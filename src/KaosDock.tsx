"use client";

/*
 * KaosDock · el menú inferior común de Kaoticode (familia Kaos, ver DESIGN.md).
 *
 * Todas las webs copian este archivo TAL CUAL; los estilos van en kaos.css
 * (clases k-dock*). Cada web solo le pasa sus rutas, su enlace (next/link o
 * react-router) y sus extras (reproductor, cerrar sesión, publicar…).
 *
 * - Cada icono lleva siempre su nombre debajo.
 * - «Más» abre el panel con el resto de un toque; también se puede arrastrar
 *   desde el tirador o la barra (sigue al dedo y decide al soltar).
 * - Se cierra con Escape, tocando fuera o al cambiar de página.
 * - «Patrocinadores» y «Contacto» van siempre al final del panel, en todas.
 */
import { Handshake, LayoutGrid, MessageCircle, X } from "lucide-react";
import type {
  ComponentType,
  CSSProperties,
  PointerEvent,
  ReactNode,
} from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KaosBrandInfo } from "./KaosTopBar";

export interface KaosDockItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Número o texto pequeño sobre el icono (carrito, avisos…). */
  badge?: number | string;
  /** Fuerza el estado activo (si no, se calcula con la ruta). */
  active?: boolean;
  /** Destacada en el panel: va la primera y en el acento («Hazte premium»). */
  highlight?: boolean;
  /** Línea pequeña debajo del nombre en el panel (p. ej. la dirección de un local). */
  hint?: string;
}

export interface KaosDockLinkProps {
  href: string;
  className: string;
  "aria-current"?: "page";
  "aria-label"?: string;
  onClick: () => void;
  children: ReactNode;
}

/** Enlace de la web: next/link tal cual, o un adaptador para react-router. */
export type KaosDockLink = ComponentType<KaosDockLinkProps>;

interface Props {
  /** Secciones siempre visibles en la barra (lo ideal: 4). */
  items: KaosDockItem[];
  /** Secciones del panel «Más». */
  more?: KaosDockItem[];
  /** Ruta actual, para marcar la sección activa. */
  pathname: string;
  link: KaosDockLink;
  /** Contenido del panel antes de las secciones (marca, publicar…). */
  panelStart?: (close: () => void) => ReactNode;
  /** Contenido del panel después de las secciones (cuenta, cerrar sesión…). */
  panelEnd?: (close: () => void) => ReactNode;
  /** Pegado encima de la barra, dentro del dock (el reproductor de Kallate). */
  top?: ReactNode;
  /** También en escritorio (por defecto solo hasta 768 px). */
  desktop?: boolean;
  /** Icono y nombre de la web, arriba del panel (igual en todas). */
  brand?: KaosBrandInfo;
  /** Deja hueco al final de la página para que el dock no tape nada. */
  reserveSpace?: boolean;
  /** Página de patrocinadores de la web (null si no tiene). */
  sponsorsHref?: string | null;
  /** Página de contacto de la web (null si no tiene). */
  contactHref?: string | null;
}

/** Alto máximo del panel: 60 % de la pantalla y nunca más de 420 px. */
const MAX_SHEET = 420;
/** Cuánto hay que mover el dedo para que cuente como arrastre. */
const DRAG_THRESHOLD = 6;
/** Velocidad (px/ms) a partir de la cual un gesto rápido decide. */
const FLICK_SPEED = 0.35;

/** La ruta activa es la coincidencia más larga: /cuenta/pedidos gana a /cuenta. */
function resolveActive(pathname: string, hrefs: string[]): string | null {
  let active: string | null = null;
  for (const href of hrefs) {
    const path = href.split(/[?#]/)[0];
    const matches =
      path === "/"
        ? pathname === "/"
        : pathname === path || pathname.startsWith(`${path}/`);
    if (matches && (!active || path.length > active.length)) active = href;
  }
  return active;
}

function Badge({ value }: { value?: number | string }): ReactNode {
  if (value === undefined || value === 0 || value === "") return null;
  const text = typeof value === "number" && value > 99 ? "99+" : value;
  return (
    <span className="k-dock__badge" aria-hidden>
      {text}
    </span>
  );
}

/** Enlace de una fila: los externos (https://…) se abren aparte, sin el router. */
function DockLink({
  link: Link,
  href,
  children,
  ...rest
}: KaosDockLinkProps & { link: KaosDockLink }): React.ReactElement {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

/** Fila del panel para acciones (cerrar sesión…), con el mismo aspecto. */
export function KaosDockAction({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "danger";
}): React.ReactElement {
  return (
    <button
      type="button"
      className={`k-dock__row ${tone === "danger" ? "k-dock__row--danger" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span className="k-dock__row-label">{label}</span>
    </button>
  );
}

/** Título pequeño para separar grupos dentro del panel. */
export function KaosDockSection({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  return <p className="k-dock__section">{children}</p>;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startProgress: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  active: boolean;
}

export default function KaosDock({
  items,
  more: ownMore = [],
  pathname,
  link: Link,
  panelStart,
  panelEnd,
  top,
  desktop = false,
  reserveSpace = false,
  brand,
  sponsorsHref = "/patrocinadores",
  contactHref = "/contacto",
}: Props): React.ReactElement {
  // Lo común a todas las webs, al final del panel (si la web no lo trae ya).
  const common: KaosDockItem[] = [
    ...(sponsorsHref
      ? [{ href: sponsorsHref, label: "Patrocinadores", icon: <Handshake /> }]
      : []),
    ...(contactHref
      ? [{ href: contactHref, label: "Contacto", icon: <MessageCircle /> }]
      : []),
  ];
  const more = [
    ...ownMore,
    ...common.filter((c) => !ownMore.some((m) => m.href === c.href)),
  ];
  /** 0 = cerrado, 1 = abierto del todo. */
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const justDragged = useRef(false);

  const highlighted = more.filter((item) => item.highlight);
  const regular = more.filter((item) => !item.highlight);
  const hasPanel = more.length > 0 || !!panelStart || !!panelEnd;
  const activeHref = resolveActive(
    pathname,
    [...items, ...more].map((item) => item.href),
  );
  const isActive = (item: KaosDockItem): boolean =>
    item.active ?? item.href === activeHref;
  const isOpen = progress > 0;
  const expanded = progress > 0.5;
  /** La página actual está en el panel: «Más» se marca para saber dónde estás. */
  const moreActive = more.some(isActive);
  const close = (): void => setProgress(0);
  const toggle = (): void => setProgress((p) => (p > 0.5 ? 0 : 1));

  // Alto natural del panel, limitado por la pantalla.
  useLayoutEffect(() => {
    const measure = (): void => {
      const list = listRef.current;
      if (!list) return;
      setSheetHeight(
        Math.round(
          Math.min(list.scrollHeight, MAX_SHEET, window.innerHeight * 0.6),
        ),
      );
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    if (listRef.current) observer?.observe(listRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [more.length]);

  // Al cambiar de página, el panel se cierra (durante el render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setProgress(0);
  }

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setProgress(0);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (!hasPanel || sheetHeight === 0) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // La lista del panel y el reproductor tienen sus propios gestos.
    if ((event.target as HTMLElement).closest("[data-nodrag]")) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startProgress: progress,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      active: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const dy = state.startY - event.clientY;
    const dx = state.startX - event.clientX;
    if (!state.active) {
      if (Math.abs(dy) < DRAG_THRESHOLD || Math.abs(dy) < Math.abs(dx)) return;
      state.active = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const elapsed = event.timeStamp - state.lastTime;
    if (elapsed > 0) {
      const instant = (state.lastY - event.clientY) / elapsed;
      state.velocity = state.velocity * 0.4 + instant * 0.6;
    }
    state.lastY = event.clientY;
    state.lastTime = event.timeStamp;
    setProgress(
      Math.min(1, Math.max(0, state.startProgress + dy / sheetHeight)),
    );
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    drag.current = null;
    if (!state || state.pointerId !== event.pointerId || !state.active) return;
    setDragging(false);
    const next =
      Math.abs(state.velocity) > FLICK_SPEED
        ? state.velocity > 0
        : progress > 0.5;
    setProgress(next ? 1 : 0);
    // El «click» que sigue a soltar un arrastre no debe abrir ningún enlace.
    justDragged.current = true;
    setTimeout(() => {
      justDragged.current = false;
    }, 0);
  };

  const style = { "--p": progress, "--h": `${sheetHeight}px` } as CSSProperties;
  const rootClass = [
    "k-dock",
    desktop && "k-dock--desktop",
    reserveSpace && "k-dock--space",
    dragging && "k-dock--dragging",
    isOpen && "k-dock--open",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} style={style}>
      <button
        type="button"
        className="k-dock__overlay"
        aria-label="Cerrar menú"
        tabIndex={isOpen ? 0 : -1}
        onClick={close}
      />
      <div className="k-dock__wrap">
        <div
          className="k-dock__panel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={(event) => {
            if (!justDragged.current) return;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {hasPanel && (
            <>
              <span className="k-dock__handle" aria-hidden />
              <div className="k-dock__sheet">
                <div className="k-dock__sheet-inner" inert={!isOpen}>
                  <div ref={listRef} className="k-dock__list" data-nodrag>
                    {brand && (
                      <Link
                        href={brand.href}
                        className="k-brand k-brand--sm k-dock__brand"
                        onClick={close}
                      >
                        {/* biome-ignore lint/performance/noImgElement: icono pequeño de la marca, igual en todas las webs (también fuera de Next). */}
                        <img
                          className="k-brand__mark"
                          src={brand.icon}
                          alt=""
                          aria-hidden
                        />
                        <span className="k-brand__name">{brand.name}</span>
                      </Link>
                    )}
                    {highlighted.map((item) => (
                      <DockLink
                        link={Link}
                        key={item.href}
                        href={item.href}
                        className="k-dock__row k-dock__row--highlight"
                        aria-current={isActive(item) ? "page" : undefined}
                        onClick={close}
                      >
                        {item.icon}
                        <span className="k-dock__row-label">{item.label}</span>
                        <Badge value={item.badge} />
                      </DockLink>
                    ))}
                    {panelStart?.(close)}
                    {regular.map((item) => {
                      const active = isActive(item);
                      return (
                        <DockLink
                          link={Link}
                          key={item.href}
                          href={item.href}
                          className={`k-dock__row ${active ? "k-dock__row--active" : ""}`}
                          aria-current={active ? "page" : undefined}
                          onClick={close}
                        >
                          {item.icon}
                          <span className="k-dock__row-label">
                            {item.label}
                            {item.hint && (
                              <span className="k-dock__row-hint">
                                {item.hint}
                              </span>
                            )}
                          </span>
                          <Badge value={item.badge} />
                        </DockLink>
                      );
                    })}
                    {panelEnd?.(close)}
                  </div>
                </div>
              </div>
            </>
          )}
          {top && (
            <div className="k-dock__top" data-nodrag>
              {top}
            </div>
          )}
          <nav className="k-dock__bar" aria-label="Navegación principal">
            {items.map((item) => {
              const active = isActive(item) && !isOpen;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`k-dock__item ${active ? "k-dock__item--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  aria-label={
                    item.badge ? `${item.label} (${item.badge})` : undefined
                  }
                  onClick={close}
                >
                  <span className="k-dock__icon">
                    {item.icon}
                    <Badge value={item.badge} />
                  </span>
                  <span className="k-dock__label">{item.label}</span>
                </Link>
              );
            })}
            {hasPanel && (
              <button
                type="button"
                className={`k-dock__item ${isOpen || moreActive ? "k-dock__item--active" : ""}`}
                aria-expanded={expanded}
                aria-label={expanded ? "Cerrar menú" : "Más secciones"}
                onClick={toggle}
              >
                <span className="k-dock__icon">
                  {isOpen ? <X aria-hidden /> : <LayoutGrid aria-hidden />}
                </span>
                <span className="k-dock__label">
                  {isOpen ? "Cerrar" : "Más"}
                </span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
