"use client";

/*
 * KaosPassport · entrar con la cuenta de Kaoticode (Kaoticode ID), igual en
 * todas las webs (familia Kaos, ver DESIGN.md).
 *
 * Todas las webs copian este archivo TAL CUAL; los estilos van en kaos.css
 * (clases k-pass*), con el acento de cada web. El pasaporte enseña los sellos
 * de las apps donde vale la misma cuenta, y debajo Iniciar sesión / Crear
 * pasaporte / Recuperar contraseña. No sabe nada de la API: cada web le pasa
 * sus funciones (devuelven el texto del error, o null si ha ido bien) y, al
 * entrar, la propia web decide adónde ir.
 */
import {
  Cake,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { KAOS_PASSPORT_APPS, KAOTICODE, kaosAppIcon } from "./KaosApps";

export interface KaosSignUpData {
  username: string;
  email: string;
  /** Con prefijo, p. ej. «+34600000000». */
  phone: string;
  /** AAAA-MM-DD */
  birthDate: string;
  password: string;
}

type Result = Promise<string | null | undefined>;

export interface KaosPassportProps {
  /** Nombre de esta web («LaKancha»). */
  appName: string;
  /** id de esta web en KAOS_PASSPORT_APPS (su sello sale marcado). */
  appId: string;
  /** basePath de la web, si tiene (para los iconos de los sellos). */
  assetBase?: string;
  /** La sesión caducó: se avisa encima. */
  expired?: boolean;
  /** Texto propio encima del formulario (p. ej. «Entra para ver tus pagos»). */
  notice?: ReactNode;
  /** Sin cabecera ni sellos: solo el formulario (dentro de otra pantalla). */
  compact?: boolean;
  /** Pantalla de entrar: ocupa el alto de la pantalla y queda centrado. */
  screen?: boolean;
  /** Pestaña con la que se abre (por defecto, iniciar sesión). */
  initialTab?: "login" | "register";
  onLogin: (username: string, password: string) => Result;
  /** Si no se pasa, no hay pestaña de registro. */
  onRegister?: (data: KaosSignUpData) => Result;
  /** Manda el código de 6 cifras al email. Sin él, no hay «¿Has olvidado…?». */
  onForgot?: (identifier: string) => Result;
  onReset?: (identifier: string, code: string, password: string) => Result;
}

/** Igual que el registro de la API: 1 mayúscula, 1 número y 1 carácter especial, mínimo 8. */
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const PASSWORD_HINT =
  "Mínimo 8, con 1 mayúscula, 1 número y 1 carácter especial";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Tab = "login" | "register" | "forgot";

export default function KaosPassport(
  props: KaosPassportProps,
): React.ReactElement {
  const {
    appName,
    appId,
    assetBase = "",
    expired,
    notice,
    compact,
    screen,
    onRegister,
    onForgot,
    onReset,
    initialTab = "login",
  } = props;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [info, setInfo] = useState<string | null>(null);
  const current = KAOS_PASSPORT_APPS.find((a) => a.id === appId);

  return (
    <div
      className={`k-pass ${compact ? "k-pass--compact" : ""} ${screen ? "k-pass--screen" : ""}`}
    >
      <section className="k-pass__page">
        {!compact && (
          <>
            <p className="k-pass__pill">
              <LogIn size={12} aria-hidden /> Accediendo a {appName}
            </p>
            <h2 className="k-pass__title">Kaoticode ID</h2>
            <p className="k-pass__description">
              Un único pasaporte para entrar en cualquier app de Kaoticode. Si
              ya tienes cuenta en una, ya la tienes en todas, y tu suscripción
              también vale en todas.
            </p>
            <nav
              className="k-pass__stamps"
              aria-label="Apps de Kaoticode con la misma cuenta"
            >
              {KAOS_PASSPORT_APPS.map((app) => (
                <a
                  key={app.id}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${app.name} · ${app.tagline}`}
                  aria-label={app.name}
                  className={`k-pass__stamp ${app.id === current?.id ? "k-pass__stamp--here" : ""}`}
                  style={{ "--k-stamp": app.color } as React.CSSProperties}
                >
                  {/* biome-ignore lint/performance/noImgElement: iconos pequeños, iguales en todas las webs (también fuera de Next). */}
                  <img src={kaosAppIcon(app.id, assetBase)} alt="" />
                </a>
              ))}
            </nav>
            {current && (
              <p className="k-pass__here">
                Estás en <strong>{current.name}</strong> · la misma cuenta vale
                en todas
              </p>
            )}
          </>
        )}

        {expired && (
          <p className="k-pass__notice" aria-live="polite">
            Tu sesión ha caducado. Vuelve a entrar para seguir.
          </p>
        )}
        {notice && <div className="k-pass__notice">{notice}</div>}
        {info && (
          <p className="k-pass__notice k-pass__notice--ok" aria-live="polite">
            {info}
          </p>
        )}

        {tab === "forgot" && onForgot && onReset ? (
          <Forgot
            onForgot={onForgot}
            onReset={onReset}
            onDone={(msg) => {
              setInfo(msg);
              setTab("login");
            }}
          />
        ) : (
          <>
            {onRegister && (
              <div className="k-pass__tabs" role="tablist">
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    className={`k-pass__tab ${tab === t ? "k-pass__tab--on" : ""}`}
                    onClick={() => {
                      setInfo(null);
                      setTab(t);
                    }}
                  >
                    {t === "login" ? "Iniciar sesión" : "Crear pasaporte"}
                  </button>
                ))}
              </div>
            )}
            {tab === "register" && onRegister ? (
              <SignUp
                onRegister={onRegister}
                onDone={() => {
                  setInfo(
                    "Pasaporte creado. Ya puedes entrar con tu usuario y tu contraseña.",
                  );
                  setTab("login");
                }}
              />
            ) : (
              <SignIn
                onLogin={props.onLogin}
                onForgot={
                  onForgot && onReset ? () => setTab("forgot") : undefined
                }
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Field({
  icon,
  error,
  children,
}: {
  icon: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="k-pass__group">
      <div className={`k-pass__field ${error ? "k-pass__field--error" : ""}`}>
        <span className="k-pass__icon">{icon}</span>
        {children}
      </div>
      {error && <p className="k-pass__field-error">{error}</p>}
    </div>
  );
}

function PasswordInput({
  name,
  placeholder,
  autoComplete,
}: {
  name: string;
  placeholder: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <input
        className="k-pass__input"
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="k-pass__eye"
        onClick={() => setShow(!show)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </>
  );
}

function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button type="submit" className="k-pass__submit" disabled={busy}>
      {busy ? <span className="k-pass__spinner" aria-hidden /> : children}
    </button>
  );
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="k-pass__error" role="alert">
      {error}
    </p>
  );
}

function SignIn({
  onLogin,
  onForgot,
}: {
  onLogin: KaosPassportProps["onLogin"];
  onForgot?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") ?? "")
      .trim()
      .toLowerCase();
    const password = String(fd.get("password") ?? "");
    if (!username || !password)
      return setError("Escribe tu usuario y tu contraseña");
    setBusy(true);
    setError(null);
    try {
      const err = await onLogin(username, password);
      if (err) setError(err);
    } catch {
      setError("No se ha podido conectar. Inténtalo de nuevo.");
    }
    setBusy(false);
  };

  return (
    <form className="k-pass__form" onSubmit={submit} noValidate>
      <Field icon={<User size={18} />}>
        <input
          className="k-pass__input"
          name="username"
          placeholder="Usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>
      <Field icon={<Lock size={18} />}>
        <PasswordInput
          name="password"
          placeholder="Contraseña"
          autoComplete="current-password"
        />
      </Field>
      {onForgot && (
        <button type="button" className="k-pass__link" onClick={onForgot}>
          ¿Has olvidado tu contraseña?
        </button>
      )}
      <ErrorText error={error} />
      <Submit busy={busy}>
        <LogIn size={18} /> Iniciar sesión
      </Submit>
    </form>
  );
}

type SignUpErrors = Partial<Record<keyof KaosSignUpData | "confirm", string>>;

function SignUp({
  onRegister,
  onDone,
}: {
  onRegister: NonNullable<KaosPassportProps["onRegister"]>;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<SignUpErrors>({});

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "");
    const data: KaosSignUpData = {
      username: v("username").trim().toLowerCase(),
      email: v("email").trim().toLowerCase(),
      phone: v("phone").replace(/[^\d+]/g, ""),
      birthDate: v("birthDate"),
      password: v("password"),
    };
    const next: SignUpErrors = {};
    if (data.username.length < 3) next.username = "Mínimo 3 caracteres";
    else if (data.username.length > 15)
      next.username = "No puede tener más de 15 caracteres";
    else if (/\s/.test(data.username))
      next.username = "No puede contener espacios";
    if (!EMAIL_RE.test(data.email)) next.email = "Formato de correo inválido";
    if (data.phone.replace(/\D/g, "").length < 8)
      next.phone = "Teléfono con prefijo, p. ej. +34 600 000 000";
    if (!data.birthDate) next.birthDate = "Fecha de nacimiento requerida";
    if (!PASSWORD_RE.test(data.password)) next.password = PASSWORD_HINT;
    if (v("confirm") !== data.password)
      next.confirm = "Las contraseñas no coinciden";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setError(null);
    try {
      const err = await onRegister(data);
      if (err) setError(err);
      else onDone();
    } catch {
      setError("No se ha podido conectar. Inténtalo de nuevo.");
    }
    setBusy(false);
  };

  return (
    <form className="k-pass__form" onSubmit={submit} noValidate>
      <Field icon={<User size={18} />} error={errors.username}>
        <input
          className="k-pass__input"
          name="username"
          placeholder="Nombre de usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>
      <Field icon={<Mail size={18} />} error={errors.email}>
        <input
          className="k-pass__input"
          name="email"
          type="email"
          placeholder="Correo electrónico"
          autoComplete="email"
        />
      </Field>
      <Field icon={<Phone size={18} />} error={errors.phone}>
        <input
          className="k-pass__input"
          name="phone"
          type="tel"
          defaultValue="+34 "
          placeholder="Teléfono"
          autoComplete="tel"
        />
      </Field>
      <Field icon={<Cake size={18} />} error={errors.birthDate}>
        <input
          className="k-pass__input"
          name="birthDate"
          type="date"
          aria-label="Fecha de nacimiento"
        />
      </Field>
      <Field icon={<Lock size={18} />} error={errors.password}>
        <PasswordInput
          name="password"
          placeholder="Contraseña"
          autoComplete="new-password"
        />
      </Field>
      <Field icon={<Lock size={18} />} error={errors.confirm}>
        <PasswordInput
          name="confirm"
          placeholder="Confirmar contraseña"
          autoComplete="new-password"
        />
      </Field>
      <p className="k-pass__legal">
        Al continuar, confirmo que he leído y acepto los{" "}
        <a href={KAOTICODE.legalUrl} target="_blank" rel="noopener noreferrer">
          Términos y Condiciones y la Política de Privacidad
        </a>{" "}
        de Kaoticode.
      </p>
      <ErrorText error={error} />
      <Submit busy={busy}>
        <UserPlus size={18} /> Crear pasaporte
      </Submit>
    </form>
  );
}

function Forgot({
  onForgot,
  onReset,
  onDone,
}: {
  onForgot: NonNullable<KaosPassportProps["onForgot"]>;
  onReset: NonNullable<KaosPassportProps["onReset"]>;
  onDone: (message: string | null) => void;
}) {
  const [step, setStep] = useState<"ask" | "reset">("ask");
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Result, ok: () => void) => {
    setBusy(true);
    setError(null);
    try {
      const err = await fn();
      if (err) setError(err);
      else ok();
    } catch {
      setError("No se ha podido conectar. Inténtalo de nuevo.");
    }
    setBusy(false);
  };

  const ask = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = String(
      new FormData(e.currentTarget).get("identifier") ?? "",
    ).trim();
    if (!id) return setError("Escribe tu usuario o tu email");
    void run(
      () => onForgot(id),
      () => {
        setIdentifier(id);
        setStep("reset");
      },
    );
  };

  const reset = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = String(fd.get("code") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!/^\d{6}$/.test(code)) return setError("El código tiene 6 cifras");
    if (!PASSWORD_RE.test(password)) return setError(PASSWORD_HINT);
    if (String(fd.get("confirm") ?? "") !== password)
      return setError("Las contraseñas no coinciden");
    void run(
      () => onReset(identifier, code, password),
      () => onDone("Contraseña cambiada. Ya puedes entrar con la nueva."),
    );
  };

  return (
    <div className="k-pass__form">
      <p className="k-pass__subtitle">
        <KeyRound size={16} aria-hidden /> Recuperar contraseña
      </p>
      {step === "ask" ? (
        <form className="k-pass__form" onSubmit={ask} noValidate>
          <p className="k-pass__hint">
            Te mandamos un código de 6 cifras al email de tu cuenta de
            Kaoticode.
          </p>
          <Field icon={<User size={18} />}>
            <input
              className="k-pass__input"
              name="identifier"
              placeholder="Usuario o email"
              autoCapitalize="none"
              spellCheck={false}
            />
          </Field>
          <ErrorText error={error} />
          <Submit busy={busy}>Enviar código</Submit>
        </form>
      ) : (
        <form className="k-pass__form" onSubmit={reset} noValidate>
          <p className="k-pass__hint">
            Revisa tu email: escribe el código y tu contraseña nueva.
          </p>
          <Field icon={<KeyRound size={18} />}>
            <input
              className="k-pass__input"
              name="code"
              inputMode="numeric"
              maxLength={6}
              placeholder="Código de 6 cifras"
              autoComplete="one-time-code"
            />
          </Field>
          <Field icon={<Lock size={18} />}>
            <PasswordInput
              name="password"
              placeholder="Contraseña nueva"
              autoComplete="new-password"
            />
          </Field>
          <Field icon={<Lock size={18} />}>
            <PasswordInput
              name="confirm"
              placeholder="Confirmar contraseña"
              autoComplete="new-password"
            />
          </Field>
          <ErrorText error={error} />
          <Submit busy={busy}>Cambiar contraseña</Submit>
        </form>
      )}
      <button
        type="button"
        className="k-pass__link"
        onClick={() => onDone(null)}
      >
        Volver
      </button>
    </div>
  );
}
