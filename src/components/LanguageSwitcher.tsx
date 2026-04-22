import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  const Btn = ({ value, label }: { value: Lang; label: string }) => (
    <button
      onClick={() => setLang(value)}
      aria-label={`Switch language to ${label}`}
      aria-pressed={lang === value}
      className={cn(
        "px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider transition",
        lang === value
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-border/60 bg-card/80 backdrop-blur",
        className,
      )}
    >
      <Btn value="pt" label="PT" />
      <Btn value="en" label="EN" />
    </div>
  );
}
