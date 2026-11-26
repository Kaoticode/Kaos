"use client";
/*
 * KaosName · nombre de usuario que brilla según su plan de Kaoticode
 * (bronce en marrón, plata en plateado, oro en dorado), igual en todas las
 * webs. Los usuarios son los de Komunly: el nivel se pide a su API pública
 * (/public/plan-tiers) en lotes y se guarda unos minutos; si la web ya lo
 * sabe, se le pasa con `tier` y no se pide nada.
 *
 *   <KaosName name={author.username} userId={author.id} />
 *
 * Estilos k-name* en kaos.css.
 */
import { useEffect, useState } from "react";
import { KAOS_SPONSORS_API } from "./KaosSponsors";

export type KaosPlanTier = "bronze" | "silver" | "gold";

const TIERS: readonly string[] = ["bronze", "silver", "gold"];
const LABEL: Record<KaosPlanTier, string> = { bronze: "Bronce", silver: "Plata", gold: "Oro" };
const TTL_MS = 5 * 60 * 1000;
const BATCH = 100;

let apiUrl = KAOS_SPONSORS_API;

/** Cambia la API de Komunly (por defecto la de producción). */
export function configureKaosNames(options: { apiUrl?: string }): void {
  if (options.apiUrl) apiUrl = options.apiUrl.replace(/\/+$/, "");
}

/** Plan de un usuario: nivel (color) y nombre tal cual está en el admin. */
export interface KaosPlan {
  tier: KaosPlanTier | null;
  name: string | null;
}

type Entry = KaosPlan & { at: number };
const NONE: KaosPlan = { tier: null, name: null };
const cache = new Map<string, Entry>();
const queue = new Set<string>();
const listeners = new Map<string, Set<(plan: KaosPlan) => void>>();
let timer: ReturnType<typeof setTimeout> | null = null;

const keyOf = (userId?: string | null, username?: string | null): string | null =>
  userId ? `id:${userId}` : username ? `u:${username.toLowerCase()}` : null;

const asTier = (value: unknown): KaosPlanTier | null =>
  typeof value === "string" && TIERS.includes(value) ? (value as KaosPlanTier) : null;

const asName = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : null;

function settle(key: string, plan: KaosPlan): void {
  cache.set(key, { ...plan, at: Date.now() });
  for (const fn of listeners.get(key) ?? []) fn(plan);
}

async function flush(): Promise<void> {
  timer = null;
  const keys = [...queue];
  queue.clear();
  for (let i = 0; i < keys.length; i += BATCH) {
    const chunk = keys.slice(i, i + BATCH);
    const ids = chunk.filter((k) => k.startsWith("id:")).map((k) => k.slice(3));
    const names = chunk.filter((k) => k.startsWith("u:")).map((k) => k.slice(2));
    const qs = new URLSearchParams();
    if (ids.length) qs.set("ids", ids.join(","));
    if (names.length) qs.set("usernames", names.join(","));
    try {
      const res = await fetch(`${apiUrl}/public/plan-tiers?${qs}`, { credentials: "omit" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        ids?: Record<string, unknown>;
        usernames?: Record<string, unknown>;
        names?: { ids?: Record<string, unknown>; usernames?: Record<string, unknown> };
      };
      for (const id of ids) {
        const tier = asTier(data.ids?.[id]);
        settle(`id:${id}`, { tier, name: tier ? asName(data.names?.ids?.[id]) : null });
      }
      for (const name of names) {
        const tier = asTier(data.usernames?.[name]);
        settle(`u:${name}`, { tier, name: tier ? asName(data.names?.usernames?.[name]) : null });
      }
    } catch {
      // Sin API (o versión antigua): el nombre se queda normal, sin reintentar en bucle.
      for (const k of chunk) settle(k, NONE);
    }
  }
}

function request(key: string): void {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return;
  queue.add(key);
  if (!timer) timer = setTimeout(flush, 40);
}

/** Plan de un usuario (nivel y nombre); vacío mientras no se sabe o si no tiene. */
export function useKaosPlan(user: {
  userId?: string | null;
  username?: string | null;
  tier?: KaosPlanTier | null;
  planName?: string | null;
}): KaosPlan {
  const known = user.tier !== undefined;
  const key = known ? null : keyOf(user.userId, user.username);
  const [plan, setPlan] = useState<KaosPlan>(() => {
    if (known) return { tier: asTier(user.tier), name: asName(user.planName) };
    const hit = key ? cache.get(key) : undefined;
    return hit ? { tier: hit.tier, name: hit.name } : NONE;
  });

  useEffect(() => {
    if (known) {
      setPlan({ tier: asTier(user.tier), name: asName(user.planName) });
      return;
    }
    if (!key) return;
    const set = listeners.get(key) ?? new Set();
    set.add(setPlan);
    listeners.set(key, set);
    const hit = cache.get(key);
    if (hit) setPlan({ tier: hit.tier, name: hit.name });
    request(key);
    return () => {
      set.delete(setPlan);
    };
  }, [key, known, user.tier, user.planName]);

  return plan;
}

/** Nivel del plan de un usuario (null mientras no se sabe o si no tiene). */
export function useKaosPlanTier(user: {
  userId?: string | null;
  username?: string | null;
  tier?: KaosPlanTier | null;
}): KaosPlanTier | null {
  return useKaosPlan(user).tier;
}

export interface KaosNameProps {
  /** Nombre que se pinta. */
  name: string;
  /** Id de Komunly (lo más fiable). */
  userId?: string | null;
  /** Usuario de Komunly, si no hay id (por defecto, el propio `name`). */
  username?: string | null;
  /** Nivel ya conocido: no se pide nada a la API. */
  tier?: KaosPlanTier | null;
  className?: string;
  /** Etiqueta HTML (por defecto, span). */
  as?: "span" | "strong" | "p" | "h1" | "h2" | "h3";
}

export default function KaosName({
  name,
  userId,
  username,
  tier,
  className,
  as: Tag = "span",
}: KaosNameProps): React.ReactNode {
  const plan = useKaosPlanTier({ userId, username: username ?? (userId ? null : name), tier });
  return (
    <Tag
      className={`k-name${plan ? ` k-name--${plan}` : ""}${className ? ` ${className}` : ""}`}
      title={plan ? `Plan ${LABEL[plan]}` : undefined}
    >
      {name}
    </Tag>
  );
}

export interface KaosPlanBadgeProps {
  userId?: string | null;
  username?: string | null;
  tier?: KaosPlanTier | null;
  /** Nombre del plan ya conocido (si no, se pide a la API con el nivel). */
  planName?: string | null;
  className?: string;
}

/**
 * Etiqueta con el nombre del plan (p. ej. «K-Gold»), del color de su nivel.
 * Si la API aún no manda el nombre, pone «Plan Oro/Plata/Bronce».
 * No pinta nada sin plan.
 */
export function KaosPlanBadge({ userId, username, tier, planName, className }: KaosPlanBadgeProps): React.ReactNode {
  const plan = useKaosPlan({ userId, username, tier, planName });
  if (!plan.tier) return null;
  return (
    <span
      className={`k-plan-badge k-plan-badge--${plan.tier}${className ? ` ${className}` : ""}`}
      title={`Plan ${LABEL[plan.tier]}`}
    >
      {plan.name ?? `Plan ${LABEL[plan.tier]}`}
    </span>
  );
}
