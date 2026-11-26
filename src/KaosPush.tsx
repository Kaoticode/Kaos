"use client";

/*
 * KaosPush · «¿Te avisamos?» al iniciar sesión (familia Kaos, ver DESIGN.md).
 *
 * Con sesión iniciada, si el navegador aún no ha decidido sobre los avisos,
 * sale una tarjeta encima del menú de abajo: «Activar avisos» / «Ahora no».
 * El permiso se pide al tocar (los navegadores, y el iPhone siempre, lo
 * exigen) y el dispositivo queda suscrito en Komunly a los avisos de esta app.
 *
 * - Si ya los aceptó antes, se sincroniza en silencio (una vez por visita): así
 *   el dispositivo queda enlazado a la cuenta con la que acaba de entrar.
 * - «Ahora no» se respeta unos días; si los bloqueó, no se insiste.
 * - En iPhone/iPad fuera de la app instalada no hay avisos web: se explica
 *   cómo añadirla a la pantalla de inicio (una vez cada dos semanas).
 *
 * La suscripción la guarda el servidor de cada web con el token del usuario
 * (`save`): Komunly enlaza el aviso a la cuenta SOLO por el token.
 */
import { Bell, Share, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface KaosPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  appId: string;
  tag: string;
  platform: "web";
}

type Mode = "hidden" | "ask" | "ios" | "busy" | "done";

/** Días que se respeta «Ahora no» antes de volver a preguntar. */
const SNOOZE_DAYS = 3;
const IOS_SNOOZE_DAYS = 14;
const DAY = 86_400_000;

const store = {
  get(key: string): number {
    try {
      return Number(localStorage.getItem(key)) || 0;
    } catch {
      return 0;
    }
  },
  set(key: string, value: number) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* modo privado: se volverá a preguntar */
    }
  },
};

const once = {
  done(key: string): boolean {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  },
  mark(key: string) {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* sin almacenamiento: se repetirá, no pasa nada */
    }
  },
};

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const standalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const supported = () =>
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

function toKey(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "===".slice((base64.length + 3) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function KaosPush({
  appName,
  appId,
  loggedIn,
  save,
  apiUrl,
  vapidKey,
  getKey,
  swUrl = "/sw.js",
  reason,
}: {
  appName: string;
  /** App en Komunly («kallate», «klickum»…): los avisos van solo a esta app. */
  appId: string;
  loggedIn: boolean;
  /** Guarda la suscripción en Komunly con el token del usuario; true si fue bien. */
  save: (sub: KaosPushSubscription) => Promise<boolean>;
  /** API de Komunly: de ahí sale la clave pública (GET /push/public-key). */
  apiUrl?: string;
  /** Clave pública VAPID si la web la tiene configurada (va antes que la de la API). */
  vapidKey?: string;
  /** Pide la clave al servidor de la web (que la saca de Komunly): sin variables de entorno. */
  getKey?: () => Promise<string | null>;
  /** Service worker que muestra los avisos (con manejador de «push»). */
  swUrl?: string;
  /** De qué se avisa: «cuando haya sonidos nuevos». */
  reason?: string;
}): React.ReactElement | null {
  const [mode, setMode] = useState<Mode>("hidden");
  const key = useRef<string | null>(null);
  const snoozeKey = `kaos-push:${appId}`;
  const iosKey = `kaos-push-ios:${appId}`;
  const syncKey = `kaos-push-sync:${appId}`;

  const publicKey = async (): Promise<string | null> => {
    if (key.current) return key.current;
    if (vapidKey) return (key.current = vapidKey);
    if (getKey) {
      try {
        return (key.current = (await getKey()) || null);
      } catch {
        return null;
      }
    }
    if (!apiUrl) return null;
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, "")}/push/public-key`);
      if (!res.ok) return null;
      const data = (await res.json()) as { publicKey?: string | null };
      return (key.current = data.publicKey || null);
    } catch {
      return null;
    }
  };

  /** Suscribe este dispositivo (permiso ya concedido) y lo guarda en Komunly. */
  const subscribe = async (): Promise<boolean> => {
    const vapid = await publicKey();
    if (!vapid) return false;
    try {
      // Sin «scope»: el natural del service worker (la raíz, o la subruta de
      // las webs que viven en una, como Kostumbres).
      await navigator.serviceWorker.register(swUrl);
      // «ready»: el registro ya activo de esta página (subscribe lo necesita activo).
      const reg = await navigator.serviceWorker.ready;
      const options = { userVisibleOnly: true, applicationServerKey: toKey(vapid) };
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe(options);
      } else {
        // Suscripción con otra clave (cambió la de Komunly): se rehace.
        const current = sub.options?.applicationServerKey;
        const same =
          current &&
          new Uint8Array(current).join() === options.applicationServerKey.join();
        if (current && !same) {
          await sub.unsubscribe();
          sub = await reg.pushManager.subscribe(options);
        }
      }
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
      return await save({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        appId,
        tag: appId,
        platform: "web",
      });
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!loggedIn) {
      setMode("hidden");
      return;
    }
    let alive = true;
    const timer = window.setTimeout(async () => {
      if (!supported()) {
        // iPhone/iPad en Safari: solo hay avisos con la app en la pantalla de inicio.
        if (
          isIOS() &&
          !standalone() &&
          Date.now() - store.get(iosKey) > IOS_SNOOZE_DAYS * DAY
        )
          alive && setMode("ios");
        return;
      }
      if (Notification.permission === "denied") return;
      if (Notification.permission === "granted") {
        // Ya aceptados: enlazar este dispositivo a la cuenta, sin molestar.
        if (!once.done(syncKey) && (await subscribe())) once.mark(syncKey);
        return;
      }
      if (Date.now() - store.get(snoozeKey) < SNOOZE_DAYS * DAY) return;
      // Solo se pregunta si de verdad se podrá suscribir (hay clave).
      if (alive && (await publicKey())) setMode("ask");
    }, 1200);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, appId]);

  useEffect(() => {
    if (mode !== "done") return;
    const t = window.setTimeout(() => setMode("hidden"), 2600);
    return () => window.clearTimeout(t);
  }, [mode]);

  if (mode === "hidden") return null;

  const later = () => {
    store.set(mode === "ios" ? iosKey : snoozeKey, Date.now());
    setMode("hidden");
  };

  const enable = async () => {
    // El permiso se pide lo primero, dentro del toque (iPhone lo exige).
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      if (permission === "default") store.set(snoozeKey, Date.now());
      setMode("hidden");
      return;
    }
    setMode("busy");
    const ok = await subscribe();
    if (ok) once.mark(syncKey);
    setMode(ok ? "done" : "hidden");
  };

  if (mode === "ios") {
    return (
      <div className="k-push" role="dialog" aria-label="Avisos en iPhone">
        <span className="k-push__icon" aria-hidden>
          <Bell size={18} />
        </span>
        <span className="k-push__text">
          <strong>Avisos de {appName} en tu iPhone</strong>
          <small>
            Toca <Share size={12} aria-label="Compartir" /> y «Añadir a pantalla
            de inicio»; abre {appName} desde allí y actívalos.
          </small>
        </span>
        <button
          type="button"
          className="k-push__close"
          aria-label="Entendido"
          onClick={later}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="k-push" role="dialog" aria-label="Activar avisos" aria-live="polite">
      <span className="k-push__icon" aria-hidden>
        <Bell size={18} />
      </span>
      <span className="k-push__text">
        {mode === "done" ? (
          <>
            <strong>Avisos activados</strong>
            <small>Te avisaremos desde {appName}.</small>
          </>
        ) : (
          <>
            <strong>¿Te avisamos?</strong>
            <small>
              {reason
                ? `Activa los avisos de ${appName} ${reason}.`
                : `Activa los avisos de ${appName} para no perderte nada.`}
            </small>
          </>
        )}
      </span>
      {mode !== "done" && (
        <>
          <button
            type="button"
            className="k-push__go"
            onClick={enable}
            disabled={mode === "busy"}
          >
            {mode === "busy" ? "Activando…" : "Activar"}
          </button>
          <button
            type="button"
            className="k-push__close"
            aria-label="Ahora no"
            onClick={later}
            disabled={mode === "busy"}
          >
            <X size={16} />
          </button>
        </>
      )}
    </div>
  );
}
