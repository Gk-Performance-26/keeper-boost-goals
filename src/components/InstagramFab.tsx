import { Instagram } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/gkperformance.hub/";

export function InstagramFab() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Try opening in new tab first; fall back to same-tab navigation if blocked
    const win = window.open(INSTAGRAM_URL, "_blank", "noopener,noreferrer");
    if (!win) {
      window.location.href = INSTAGRAM_URL;
    }
  };

  return (
    <a
      href={INSTAGRAM_URL}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Segue @gkperformance.hub no Instagram"
      className="pointer-events-auto fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-secondary via-primary to-accent shadow-glow transition-transform hover:scale-110 active:scale-95"
    >
      <Instagram className="h-6 w-6 text-primary-foreground" />
    </a>
  );
}
