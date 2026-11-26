"use client";
/*
 * KaosShare · botón de compartir común de Kaoticode (familia Kaos).
 *
 * En el móvil abre la hoja nativa del sistema (WhatsApp, Telegram, Instagram,
 * AirDrop…). Donde no existe (casi todos los ordenadores), abre un panel
 * propio con WhatsApp, Telegram, X, Facebook, correo y «Copiar enlace».
 * Estilos en kaos.css (clases k-share*).
 */
import { Check, Link2, Mail, MessageCircle, Send, Share2, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

export interface KaosShareProps {
  /** Dirección a compartir; relativa o absoluta. Por defecto, la página actual. */
  url?: string;
  /** Título (nombre del producto, del sonido…). */
  title: string;
  /** Frase que acompaña al enlace. */
  text?: string;
  /** Texto del botón. */
  label?: string;
  /** "button": botón con texto; "icon": solo el icono, redondo. */
  variant?: "button" | "icon";
  className?: string;
}

const absolute = (url?: string): string => {
  if (typeof window === "undefined") return url ?? "";
  return new URL(url ?? window.location.href, window.location.origin).toString();
};

export default function KaosShare({
  url,
  title,
  text,
  label = "Compartir",
  variant = "button",
  className,
}: KaosShareProps): ReactNode {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const open = async (): Promise<void> => {
    const href = absolute(url);
    setLink(href);
    const data = { title, text: text ?? title, url: href };
    if (typeof navigator.share === "function" && navigator.canShare?.(data) !== false) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        // Cerrar la hoja nativa no es un error; si falla de verdad, panel propio.
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }
    dialog.current?.showModal();
  };

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const input = document.createElement("input");
      input.value = link;
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
  };

  const message = `${text ?? title} ${link}`;
  const e = encodeURIComponent;
  const targets = [
    { name: "WhatsApp", icon: <MessageCircle aria-hidden />, href: `https://wa.me/?text=${e(message)}` },
    {
      name: "Telegram",
      icon: <Send aria-hidden />,
      href: `https://t.me/share/url?url=${e(link)}&text=${e(text ?? title)}`,
    },
    {
      name: "X",
      icon: <span className="k-share__letter">X</span>,
      href: `https://x.com/intent/post?url=${e(link)}&text=${e(text ?? title)}`,
    },
    {
      name: "Facebook",
      icon: <span className="k-share__letter">f</span>,
      href: `https://www.facebook.com/sharer/sharer.php?u=${e(link)}`,
    },
    {
      name: "Correo",
      icon: <Mail aria-hidden />,
      href: `mailto:?subject=${e(title)}&body=${e(message)}`,
    },
  ];

  return (
    <>
      <button
        type="button"
        className={`k-share-btn${variant === "icon" ? " k-share-btn--icon" : ""}${className ? ` ${className}` : ""}`}
        onClick={open}
        aria-label={variant === "icon" ? label : undefined}
        title={variant === "icon" ? label : undefined}
      >
        <Share2 aria-hidden />
        {variant === "button" && <span>{label}</span>}
      </button>
      <dialog
        ref={dialog}
        className="k-share"
        aria-label={`Compartir «${title}»`}
        onClick={(ev) => {
          // Tocar fuera del panel lo cierra.
          if (ev.target === ev.currentTarget) ev.currentTarget.close();
        }}
      >
        <div className="k-share__panel">
          <div className="k-share__head">
            <div>
              <p className="k-share__kicker">Compartir</p>
              <p className="k-share__title">{title}</p>
            </div>
            <button
              type="button"
              className="k-share__close"
              aria-label="Cerrar"
              onClick={() => dialog.current?.close()}
            >
              <X aria-hidden />
            </button>
          </div>
          <div className="k-share__grid">
            {targets.map((t) => (
              <a
                key={t.name}
                className="k-share__target"
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => dialog.current?.close()}
              >
                <span className="k-share__icon">{t.icon}</span>
                {t.name}
              </a>
            ))}
          </div>
          <div className="k-share__copy">
            <span className="k-share__link">{link}</span>
            <button type="button" className="k-share__copy-btn" onClick={copy}>
              {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </button>
          </div>
          <span className="k-share__live" aria-live="polite">
            {copied ? "Enlace copiado" : ""}
          </span>
        </div>
      </dialog>
    </>
  );
}

/**
 * Fila con el botón «Compartir» alineado a la derecha, para ponerla encima del
 * contenido de una ficha (receta, evento, producto…) sin tocar su maquetación.
 */
export function KaosShareBar(props: Omit<KaosShareProps, "variant">): ReactNode {
  return (
    <div className="k-share-bar">
      <KaosShare {...props} />
    </div>
  );
}
