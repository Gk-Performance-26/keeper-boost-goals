import { Instagram } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const INSTAGRAM_URL = "https://www.instagram.com/gkperformance.hub/";

export function InstagramFab() {
  const [open, setOpen] = useState(false);

  const handleContinue = () => {
    const isFramed = window.self !== window.top;

    if (isFramed) {
      const popup = window.open(INSTAGRAM_URL, "_blank", "noopener,noreferrer");
      if (popup) {
        setOpen(false);
        return;
      }

      try {
        window.top?.location.assign(INSTAGRAM_URL);
        setOpen(false);
        return;
      } catch {
        return;
      }
    }

    window.location.assign(INSTAGRAM_URL);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Segue @gkperformance.hub no Instagram"
        className="pointer-events-auto fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-secondary via-primary to-accent shadow-glow transition-transform hover:scale-110 active:scale-95"
      >
        <Instagram className="h-6 w-6 text-primary-foreground" />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair para o Instagram?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Vais ser redirecionado para <strong>@gkperformance.hub</strong> no Instagram.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button asChild>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                Continuar
              </a>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
