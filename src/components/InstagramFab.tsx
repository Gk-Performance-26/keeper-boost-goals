import { Instagram } from "lucide-react";

export function InstagramFab() {
  return (
    <a
      href="https://instagram.com/gkperformance.hub"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Segue @gkperformance.hub no Instagram"
      className="pointer-events-auto fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-secondary via-primary to-accent shadow-glow transition-transform hover:scale-110 active:scale-95"
    >
      <Instagram className="h-6 w-6 text-primary-foreground" />
    </a>
  );
}
