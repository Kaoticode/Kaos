/*
 * KaosFeedback · avisos, vacíos y errores comunes de Kaoticode (familia Kaos).
 *
 * Todas las webs copian este archivo TAL CUAL; los estilos van en kaos.css
 * (clases k-toast*, k-state*). No depende de ninguna librería de avisos ni del
 * router: cada web lo usa desde sus propios toastMessage, MessageInfo y
 * ErrorMessage, que mantienen la forma de llamarlos que ya tenían.
 */
import type { CSSProperties, ReactNode } from "react";
import {
  AlertTriangle,
  CircleCheck,
  Inbox,
  Info,
  Lock,
  SearchX,
  ServerCrash,
  ShieldAlert,
  TriangleAlert,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";

export type KaosToastType = "success" | "error" | "info" | "warning";

/** Cuánto se queda cada aviso: los errores, algo más para poder leerlos. */
export const KAOS_TOAST_DURATION: Record<KaosToastType, number> = {
  success: 4000,
  info: 4500,
  warning: 5500,
  error: 6000,
};

const TOAST_ICONS = {
  success: CircleCheck,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
};

/** Título por defecto cuando el aviso solo trae el mensaje. */
const TOAST_TITLES: Record<KaosToastType, string> = {
  success: "Hecho",
  error: "Algo ha fallado",
  info: "Aviso",
  warning: "Atención",
};

/**
 * El aviso: icono del tipo, título, mensaje y un fondo del mismo color que se
 * vacía hacia la izquierda mientras está activo.
 */
export function KaosToastCard({
  type,
  title,
  message,
  duration = KAOS_TOAST_DURATION[type],
  icon,
  onClose,
}: {
  type: KaosToastType;
  title?: string;
  message?: string;
  /** Icono propio; por defecto, el del tipo. */
  icon?: ReactNode;
  duration?: number;
  onClose?: () => void;
}): React.ReactElement {
  const Icon = TOAST_ICONS[type];
  // Si solo hay un texto, va como título (más legible que un título genérico).
  const heading = title?.trim() || message?.trim() || TOAST_TITLES[type];
  const body = title?.trim() ? message : undefined;

  return (
    <div
      className={`k-toast k-toast--${type}`}
      role={type === "error" ? "alert" : "status"}
      style={{ "--k-toast-duration": `${duration}ms` } as CSSProperties}
    >
      <span className="k-toast__progress" aria-hidden />
      <span className="k-toast__icon" aria-hidden>
        {icon ?? <Icon size={20} />}
      </span>
      <div className="k-toast__text">
        <p className="k-toast__title">{heading}</p>
        {body && <p className="k-toast__message">{body}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          className="k-toast__close"
          aria-label="Cerrar aviso"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * Estado vacío («No hay resultados»): icono con un halo suave, el mensaje y,
 * si procede, una acción. Con `subText`, `text` va como etiqueta pequeña encima.
 */
export function KaosEmpty({
  text,
  subText,
  hint,
  icon,
  action,
}: {
  text: ReactNode;
  subText?: ReactNode;
  /** Una línea más pequeña debajo (p. ej. «Prueba con otros filtros»). */
  hint?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}): React.ReactElement {
  return (
    <div className="k-state k-state--empty">
      <span className="k-state__badge" aria-hidden>
        <span className="k-state__halo" />
        <span className="k-state__icon">{icon ?? <Inbox size={28} />}</span>
      </span>
      {subText ? (
        <>
          <p className="k-state__eyebrow">{text}</p>
          <p className="k-state__title">{subText}</p>
        </>
      ) : (
        <p className="k-state__title">{text}</p>
      )}
      {hint && <p className="k-state__message">{hint}</p>}
      {action && <div className="k-state__actions">{action}</div>}
    </div>
  );
}

/** Título e icono según el tipo de fallo, a partir del propio mensaje. */
function classify(message: string): {
  title: string;
  icon: ReactNode;
  tone: "danger" | "warn";
} {
  const text = message.toLowerCase();
  if (/sesión|sesion|token|credenciales/.test(text))
    return { title: "Sesión caducada", icon: <Lock size={26} />, tone: "warn" };
  if (/permisos|no autorizado|forbidden/.test(text))
    return {
      title: "Sin acceso",
      icon: <ShieldAlert size={26} />,
      tone: "warn",
    };
  if (/conectar|conexión|conexion|network|fetch failed/.test(text))
    return { title: "Sin conexión", icon: <WifiOff size={26} />, tone: "warn" };
  if (/servidor tuvo|código 5|codigo 5|internal server/.test(text))
    return {
      title: "El servidor no responde bien",
      icon: <ServerCrash size={26} />,
      tone: "danger",
    };
  if (/no se encontr|no existe|not found|cannot get/.test(text))
    return {
      title: "No encontrado",
      icon: <SearchX size={26} />,
      tone: "warn",
    };
  return {
    title: "Algo salió mal",
    icon: <AlertTriangle size={26} />,
    tone: "danger",
  };
}

/**
 * Error de una carga (la API falló): dice qué ha pasado con las palabras del
 * servidor y ofrece salidas (reintentar, volver…), que pone cada web.
 */
export function KaosError({
  message,
  title,
  detail,
  actions,
}: {
  message?: string | null;
  title?: string;
  detail?: string;
  actions?: ReactNode;
}): React.ReactElement {
  const text = message?.trim() || "Ocurrió un error inesperado.";
  const kind = classify(text);
  return (
    <div className="k-state k-state--error" role="alert">
      <div className={`k-state__card k-state__card--${kind.tone}`}>
        <span className="k-state__alert" aria-hidden>
          {kind.icon}
        </span>
        <h3 className="k-state__title">{title ?? kind.title}</h3>
        <p className="k-state__message">{text}</p>
        {detail && <p className="k-state__detail">{detail}</p>}
        {actions && <div className="k-state__actions">{actions}</div>}
      </div>
    </div>
  );
}
