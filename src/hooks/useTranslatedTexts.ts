import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const CACHE_PREFIX = "gk-tr2:";

// In-memory cache and inflight tracker (shared across all hook instances)
const memCache = new Map<string, string>(); // key: `${lang}:${text}` -> translation
const inflight = new Map<string, Promise<void>>(); // key: `${lang}:${text}` -> pending fetch

function memKey(target: string, text: string) {
  return `${target}:${text}`;
}

function lsKey(target: string, text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `${CACHE_PREFIX}${target}:${h}`;
}

function readCache(target: string, text: string): string | null {
  const mk = memKey(target, text);
  if (memCache.has(mk)) return memCache.get(mk)!;
  if (typeof localStorage === "undefined") return null;
  try {
    const v = localStorage.getItem(lsKey(target, text));
    if (v != null) memCache.set(mk, v);
    return v;
  } catch {
    return null;
  }
}

function writeCache(target: string, text: string, value: string) {
  memCache.set(memKey(target, text), value);
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(lsKey(target, text), value);
  } catch {
    /* quota */
  }
}

async function fetchAndCache(target: string, missing: string[]): Promise<void> {
  // Filter out items already inflight; share their promises
  const toFetch: string[] = [];
  const waitOn: Promise<void>[] = [];
  for (const t of missing) {
    const k = memKey(target, t);
    const p = inflight.get(k);
    if (p) waitOn.push(p);
    else toFetch.push(t);
  }

  if (toFetch.length > 0) {
    const promise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("translate-content", {
          body: { texts: toFetch, target },
        });
        if (error || !data?.translations) {
          console.warn("[translate-content] failed", error);
          return;
        }
        const translations: string[] = data.translations;
        toFetch.forEach((src, i) => {
          const tr = translations[i];
          if (typeof tr === "string" && tr) writeCache(target, src, tr);
        });
      } catch (e) {
        console.warn("[translate-content] threw", e);
      }
    })();
    // Register inflight for each text
    toFetch.forEach((t) => inflight.set(memKey(target, t), promise));
    promise.finally(() => {
      toFetch.forEach((t) => inflight.delete(memKey(target, t)));
    });
    waitOn.push(promise);
  }

  await Promise.all(waitOn);
}

/**
 * Translates an array of strings to the active app language.
 * - Source language is auto-detected per text by the edge function.
 * - Texts already in the target language are returned unchanged.
 * - Reads from in-memory + localStorage cache when available.
 */
export function useTranslatedTexts(texts: (string | null | undefined)[]): string[] {
  const { lang } = useLanguage();
  const cleanInputs = texts.map((t) => t ?? "");
  const inputsKey = cleanInputs.join("\u0001");

  const compute = (): string[] =>
    cleanInputs.map((t) => (t ? readCache(lang, t) ?? t : ""));

  const [results, setResults] = useState<string[]>(compute);

  useEffect(() => {
    setResults(compute());

    const missing = Array.from(
      new Set(cleanInputs.filter((t) => t && !readCache(lang, t))),
    );
    if (missing.length === 0) return;

    let cancelled = false;
    fetchAndCache(lang, missing).then(() => {
      if (cancelled) return;
      setResults(cleanInputs.map((t) => (t ? readCache(lang, t) ?? t : "")));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, inputsKey]);

  return results;
}

export function useTranslatedText(text: string | null | undefined): string {
  const [r] = useTranslatedTexts([text]);
  return r;
}
