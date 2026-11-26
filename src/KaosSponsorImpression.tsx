"use client";

/*
 * KaosSponsorImpression · apunta que unos patrocinadores se han visto (familia
 * Kaos). Todas las webs copian este archivo TAL CUAL.
 *
 * Se pone justo después del elemento que los muestra y no ocupa sitio: cuando
 * la mitad de ese elemento entra en pantalla, manda una impresión a la API.
 * La API descarta repetidos (1 por persona y hora).
 *
 * KaosSponsorLink · el enlace a un patrocinador. Es el /go de la API, que
 * apunta el click: solo se pone en el navegador para que los robots que leen
 * el HTML (buscadores, vistas previas de enlaces) no lo sigan y cuenten clicks
 * que no ha hecho nadie.
 */
import {
  type AnchorHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

const DEFAULT_API = "https://komunly.kaoticode.dev";

export default function KaosSponsorImpression({
  ids,
  app,
  api = DEFAULT_API,
}: {
  ids: string[];
  app: string;
  api?: string;
}): React.ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  const key = ids.join(",");

  useEffect(() => {
    const marker = ref.current;
    const target = marker?.previousElementSibling ?? marker?.parentElement;
    if (!target || !key || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        fetch(`${api.replace(/\/+$/, "")}/sponsors/impressions`, {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: key.split(","), app }),
        }).catch(() => {
          /* una impresión perdida no importa */
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [key, app, api]);

  return <span ref={ref} hidden aria-hidden="true" />;
}

const noSubscribe = () => () => {};
const isBrowser = () => true;
const isServer = () => false;

export function KaosSponsorLink({
  href,
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> & {
  href: string;
  children: ReactNode;
}): React.ReactElement {
  // false en el servidor (y al hidratar), true ya en el navegador.
  const ready = useSyncExternalStore(noSubscribe, isBrowser, isServer);
  return (
    <a
      {...rest}
      href={ready ? href : undefined}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
    >
      {children}
    </a>
  );
}
