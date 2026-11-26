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

type Entry = { tier: KaosPlanTier | null; at: number };
const cache = new Map<string, Entry>();
const queue = new Set<string>();
const listeners = new Map<string, Set<(tier: KaosPlanTier | null) => void>>();
let timer: ReturnType<typeof setTimeout> | null = null;

const keyOf = (userId?: string | null, username?: string | null): string | null =>
  userId ? `id:${userId}` : username ? `u:${username.toLowerCase()}` : null;

const asTier = (value: unknown): KaosPlanTier | null =>
  typeof value === "string" && TIERS.includes(value) ? (value as KaosPlanTier) : null;

function settle(key: string, tier: KaosPlanTier | null): void {
  cache.set(key, { tier, at: Date.now() });
  for (const fn of listeners.get(key) ?? []) fn(tier);
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
      const data = (await res.json()) as { ids?: Record<string, unknown>; usernames?: Record<string, unknown> };
      for (const id of ids) settle(`id:${id}`, asTier(data.ids?.[id]));
      for (const name of names) settle(`u:${name}`, asTier(data.usernames?.[name]));
    } catch {
      // Sin API (o versión antigua): el nombre se queda normal, sin reintentar en bucle.
      for (const k of chunk) settle(k, null);
    }
  }
}

function request(key: string): void {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return;
  queue.add(key);
  if (!timer) timer = setTimeout(flush, 40);
}

/** Nivel del plan de un usuario (null mientras no se sabe o si no tiene). */
export function useKaosPlanTier(user: {
  userId?: string | null;
  username?: string | null;
  tier?: KaosPlanTier | null;
}): KaosPlanTier | null {
  const known = user.tier !== undefined;
  const key = known ? null : keyOf(user.userId, user.username);
  const [tier, setTier] = useState<KaosPlanTier | null>(() =>
    known ? asTier(user.tier) : key ? (cache.get(key)?.tier ?? null) : null,
  );

  useEffect(() => {
    if (known) {
      setTier(asTier(user.tier));
      return;
    }
    if (!key) return;
    const set = listeners.get(key) ?? new Set();
    set.add(setTier);
    listeners.set(key, set);
    const hit = cache.get(key);
    if (hit) setTier(hit.tier);
    request(key);
    return () => {
      set.delete(setTier);
    };
  }, [key, known, user.tier]);

  return tier;
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
