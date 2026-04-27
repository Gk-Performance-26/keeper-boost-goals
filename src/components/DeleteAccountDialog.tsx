import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isTestMode } from "@/lib/paddle";
import { toast } from "sonner";

export function DeleteAccountDialog() {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const REQUIRED = "DELETE";

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== REQUIRED) {
      toast.error(t("delete.typeRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account", {
        body: { environment: isTestMode() ? "sandbox" : "live" },
      });
      if (error) throw error;
      toast.success(t("delete.success"));
      setOpen(false);
      // Sign out — local session is now invalid anyway
      await signOut();
    } catch (e: any) {
      toast.error(t("delete.error") + (e.message ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /> {t("delete.button")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">{t("delete.description")}</span>
            <span className="block font-medium text-destructive">{t("delete.warning")}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-delete" className="text-xs">
            {t("delete.typePrompt")} <span className="font-mono font-bold">{REQUIRED}</span>
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={REQUIRED}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={submitting || confirmText.trim().toUpperCase() !== REQUIRED}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("delete.deleting")}
              </>
            ) : (
              t("delete.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
