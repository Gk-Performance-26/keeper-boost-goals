import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "pt" | "en";

type Dict = Record<string, string>;

const translations: Record<Lang, Dict> = {
  pt: {
    // Generic
    "common.back": "Voltar",
    "common.loading": "A carregar...",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.all": "Todos",
    // Home
    "home.greeting": "Olá",
    "home.dailyGoal": "Objetivo diário",
    "home.weeklyChallenge": "Desafio semanal",
    "home.todayPicks": "Sugestões de hoje",
    "home.browseAll": "Ver todos os treinos",
    "home.followUs": "Segue-nos",
    // Nav
    "nav.home": "Início",
    "nav.trainings": "Treinos",
    "nav.progress": "Progresso",
    "nav.leaderboard": "Ranking",
    "nav.profile": "Perfil",
    // Trainings
    "trainings.title": "Biblioteca de Treinos",
    "trainings.empty": "Nenhuma sessão corresponde",
    "trainings.minutes": "min",
    "trainings.premium": "Premium",
    "trainings.unlockPremium": "Desbloquear com Premium →",
    // Training detail
    "training.equipment": "Equipamento",
    "training.drills": "Exercícios",
    "training.finish": "Terminar sessão",
    "training.tickAll": "Marca todos",
    "training.premiumContent": "Conteúdo Premium",
    "training.unlock": "Desbloqueia este treino",
    "training.subscribeCta": "Subscreve por 10€/mês para aceder ao vídeo e a todos os exercícios premium.",
    "training.becomePremium": "Tornar-me Premium",
    "training.lockedDrills": "exercício(s) premium bloqueado(s)",
    "training.subscribeToUnlock": "Subscreve para desbloquear →",
    // Subscription
    "sub.title": "GK Performance Premium",
    "sub.subtitle": "Acesso total a todos os treinos",
    // Language
    "lang.pt": "Português",
    "lang.en": "English",
  },
  en: {
    "common.back": "Back",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.all": "All",
    "home.greeting": "Hey",
    "home.dailyGoal": "Daily goal",
    "home.weeklyChallenge": "Weekly challenge",
    "home.todayPicks": "Today's picks",
    "home.browseAll": "Browse all trainings",
    "home.followUs": "Follow us",
    "nav.home": "Home",
    "nav.trainings": "Trainings",
    "nav.progress": "Progress",
    "nav.leaderboard": "Leaderboard",
    "nav.profile": "Profile",
    "trainings.title": "Training Library",
    "trainings.empty": "No sessions match",
    "trainings.minutes": "min",
    "trainings.premium": "Premium",
    "trainings.unlockPremium": "Unlock with Premium →",
    "training.equipment": "Equipment",
    "training.drills": "Drills",
    "training.finish": "Finish session",
    "training.tickAll": "Tick all drills",
    "training.premiumContent": "Premium Content",
    "training.unlock": "Unlock this training",
    "training.subscribeCta": "Subscribe for €10/month to access the video and all premium drills.",
    "training.becomePremium": "Become Premium",
    "training.lockedDrills": "premium drill(s) locked",
    "training.subscribeToUnlock": "Subscribe to unlock →",
    "sub.title": "GK Performance Premium",
    "sub.subtitle": "Full access to all trainings",
    "lang.pt": "Português",
    "lang.en": "English",
  },
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "gk-lang";

function detectInitial(): Lang {
  if (typeof window === "undefined") return "pt";
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored === "pt" || stored === "en") return stored;
  const nav = navigator.language?.toLowerCase() ?? "";
  return nav.startsWith("en") ? "en" : "pt";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: string) => translations[lang][key] ?? translations.pt[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
