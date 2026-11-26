"use client";

/*
 * KaosUpdate · «Hay una nueva versión» (familia Kaos, ver DESIGN.md).
 *
 * Todas las webs copian este archivo TAL CUAL; los estilos van en kaos.css
 * (clases k-update*). Cada construcción de la web lleva su marca (`build`) y
 * publica la misma en /kaos-version.json. Mientras la web está abierta, mira
 * de vez en cuando (y al volver a ella) si la publicada es otra: entonces
 * ofrece actualizar sin perder el sitio. Si la web tiene service worker con una
 * versión nueva esperando, también lo detecta y la activa antes de recargar.
 */
import { RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Cada cuánto se mira si hay versión nueva con la web abierta. */
const EVERY_MS = 5 * 60_000;

export default function KaosUpdate({
  appName,
  build,
  versionUrl = "/kaos-version.json",
}: {
  appName: string;
  /** Marca de esta construcción (la misma que publica versionUrl). */
  build: string | undefined;
  versionUrl?: string;
}): React.ReactElement | null {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const waiting = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!build) return;
    let alive = true;

    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`${versionUrl}?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { build?: string };
        if (alive && data.build && data.build !== build) setAvailable(true);
      } catch {
        /* sin conexión: ya se mirará */
      }
    };

    // Service worker con una versión nueva esperando (las webs que lo tienen).
    const sw = "serviceWorker" in navigator ? navigator.serviceWorker : null;
    const track = (reg: ServiceWorkerRegistration | undefined) => {
      if (!reg) return;
      const found = (w: ServiceWorker | null) => {
        if (!w || !sw?.controller) return;
        waiting.current = w;
        if (alive) setAvailable(true);
      };
      found(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w?.addEventListener(
          "statechange",
          () => w.state === "installed" && found(w),
        );
      });
    };
    sw?.getRegistration()
      .then(track)
      .catch(() => {});

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void check();
      sw?.getRegistration()
        .then((r) => r?.update())
        .catch(() => {});
    };
    void check();
    const timer = window.setInterval(check, EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [build, versionUrl]);

  if (!available || dismissed) return null;

  const update = () => {
    setBusy(true);
    const w = waiting.current;
    if (w && "serviceWorker" in navigator) {
      // Recarga en cuanto la versión nueva toma el control (o a los 2 s, por si acaso).
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => window.location.reload(),
        { once: true },
      );
      w.postMessage("SKIP_WAITING");
      w.postMessage({ type: "SKIP_WAITING" });
      window.setTimeout(() => window.location.reload(), 2000);
      return;
    }
    window.location.reload();
  };

  return (
    <div className="k-update" aria-live="polite">
      <span className="k-update__icon" aria-hidden>
        <RefreshCw size={18} />
      </span>
      <span className="k-update__text">
        <strong>Hay una nueva versión de {appName}</strong>
        <small>Actualiza para tener lo último.</small>
      </span>
      <button
        type="button"
        className="k-update__go"
        onClick={update}
        disabled={busy}
      >
        {busy ? "Actualizando…" : "Actualizar"}
      </button>
      <button
        type="button"
        className="k-update__close"
        aria-label="Ahora no"
        onClick={() => setDismissed(true)}
      >
        <X size={16} />
      </button>
    </div>
  );
}
