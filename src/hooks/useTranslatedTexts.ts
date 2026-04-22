import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const CACHE_PREFIX = "gk-tr:";
const SOURCE_LANG = "pt"; // content in DB is stored in Portuguese

function cacheKey(target: string, text: string) {
  // small hash to keep keys short
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `${CACHE_PREFIX}${target}:${h}`;
}

function readCache(target: string, text: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const v = localStorage.getItem(cacheKey(target, text));
    return v;
  } catch {
    return null;
  }
}

function writeCache(target: string, text: string, value: string) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(cacheKey(target, text), value);
  } catch {
    /* quota */
  }
}

/**
 * Translates an array of strings to the active app language.
 * - Returns originals immediately if the language is the source (pt).
 * - Reads from localStorage cache when available.
 * - Calls the translate-content edge function for missing items.
 */
export function useTranslatedTexts(texts: (string | null | undefined)[]): string[] {
  const { lang } = useLanguage();
  const cleanInputs = texts.map((t) => t ?? "");

  const compute = (): string[] => {
    if (lang === SOURCE_LANG) return cleanInputs;
    return cleanInputs.map((t) => (t ? readCache(lang, t) ?? t : ""));
  };

  const [results, setResults] = useState<string[]>(compute);

  useEffect(() => {
    setResults(compute());

    if (lang === SOURCE_LANG) return;

    // collect unique missing texts
    const missing = Array.from(
      new Set(cleanInputs.filter((t) => t && !readCache(lang, t))),
    );
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { texts: missing, target: lang },
      });
      if (cancelled) return;
      if (error || !data?.translations) return;
      const translations: string[] = data.translations;
      missing.forEach((src, i) => {
        const tr = translations[i];
        if (typeof tr === "string" && tr) writeCache(lang, src, tr);
      });
      // re-read from cache to update state
      setResults(
        cleanInputs.map((t) => (t ? readCache(lang, t) ?? t : "")),
      );
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, cleanInputs.join("\u0001")]);

  return results;
}

export function useTranslatedText(text: string | null | undefined): string {
  const [r] = useTranslatedTexts([text]);
  return r;
}
