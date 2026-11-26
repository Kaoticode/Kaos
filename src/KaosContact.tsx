"use client";

/*
 * KaosContact · la página de contacto, igual en todas las webs de Kaoticode
 * (familia Kaos, ver DESIGN.md).
 *
 * Todas las webs copian este archivo TAL CUAL; los estilos van en kaos.css
 * (clases k-contact*). El formulario no necesita servidor: prepara el mensaje
 * y lo abre en WhatsApp (el mismo número de Kaoticode en todas), diciendo
 * desde qué web se escribe. Al lado, WhatsApp directo y el correo.
 */
import { Mail, MessageCircle, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { KAOTICODE } from "./KaosApps";

/** WhatsApp de Kaoticode (sin +, como lo quiere wa.me). */
export const KAOS_WHATSAPP = "34614234850";
export const KAOS_EMAIL = "kaoticode@gmail.com";

const REASONS = [
  "Tengo una duda",
  "Problema con mi cuenta o mi suscripción",
  "Quiero patrocinar",
  "Propuesta o colaboración",
  "Otra cosa",
];

const waLink = (text?: string): string =>
  `https://wa.me/${KAOS_WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export default function KaosContact({
  appName,
  email = KAOS_EMAIL,
}: {
  /** Nombre de esta web: el mensaje dice desde dónde se escribe. */
  appName: string;
  email?: string;
}): React.ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const reason = String(fd.get("reason") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    if (name.length < 2) return setError("Escribe tu nombre.");
    if (message.length < 5) return setError("Cuéntanos un poco más.");
    setError(null);
    const text = `Hola, soy ${name} y os escribo desde ${appName}.\n${reason ? `Motivo: ${reason}.\n` : ""}${message}`;
    window.open(waLink(text), "_blank", "noopener");
    setSent(true);
    e.currentTarget.reset();
  };

  return (
    <div className="k-contact">
      <header className="k-contact__header">
        <span className="k-contact__icon" aria-hidden>
          <MessageCircle size={26} />
        </span>
        <h1 className="k-contact__title">Hablemos</h1>
        <p className="k-contact__text">
          ¿Dudas con {appName}, con tu cuenta o quieres colaborar? Escríbenos y
          te contestamos por WhatsApp, normalmente el mismo día.
        </p>
      </header>

      <div className="k-contact__grid">
        <form className="k-contact__form" onSubmit={submit} noValidate>
          <label className="k-contact__field">
            <span>Nombre</span>
            <input
              name="name"
              autoComplete="name"
              placeholder="¿Cómo te llamas?"
            />
          </label>
          <label className="k-contact__field">
            <span>Motivo</span>
            <select name="reason" defaultValue={REASONS[0]}>
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="k-contact__field">
            <span>Mensaje</span>
            <textarea
              name="message"
              rows={5}
              placeholder="Cuéntanos en qué te podemos ayudar"
            />
          </label>
          {error && (
            <p className="k-contact__error" role="alert">
              {error}
            </p>
          )}
          {sent && !error && (
            <p className="k-contact__ok" aria-live="polite">
              Te hemos abierto WhatsApp con tu mensaje: solo falta enviarlo.
            </p>
          )}
          <button type="submit" className="k-contact__send">
            <Send size={18} aria-hidden /> Enviar por WhatsApp
          </button>
        </form>

        <aside className="k-contact__aside">
          <a
            className="k-contact__channel k-contact__channel--wa"
            href={waLink(`Hola, os escribo desde ${appName}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={22} aria-hidden />
            <span>
              <strong>WhatsApp</strong>
              <small>+34 614 234 850</small>
            </span>
          </a>
          <a className="k-contact__channel" href={`mailto:${email}`}>
            <Mail size={22} aria-hidden />
            <span>
              <strong>Correo</strong>
              <small>{email}</small>
            </span>
          </a>
          <p className="k-contact__note">
            {appName} es una app de{" "}
            <a href={KAOTICODE.url} target="_blank" rel="noopener noreferrer">
              Kaoticode
            </a>
            : el mismo equipo atiende todas sus apps.
          </p>
        </aside>
      </div>
    </div>
  );
}
