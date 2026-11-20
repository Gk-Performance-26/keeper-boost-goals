import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInvalidateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { BIO_MAX_LENGTH, bioLength, limitBio } from "@/lib/profileBio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; avatarUrl: string | null; bio: string; initial: string };

export function ProfileDetailsDialog({ open, onOpenChange, avatarUrl, bio, initial }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const invalidateProfile = useInvalidateProfile();
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(bio);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setDraft(bio); setPhoto(null); }
  }, [open, bio]);
  useEffect(() => {
    if (!photo) { setPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      toast.error(t("profile.photoInvalid"));
      return;
    }
    setPhoto(file);
  };

  const save = async () => {
    if (!user || saving || bioLength(draft) > BIO_MAX_LENGTH) return;
    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      let nextAvatar = avatarUrl;
      if (photo) {
        // Resize before upload to keep profile images fast and storage-friendly.
        const bitmap = await createImageBitmap(photo);
        const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error(t("profile.photoInvalid"));
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error(t("profile.photoInvalid"))), "image/jpeg", 0.85,
        ));
        const path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        uploadedPath = path;
        nextAvatar = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const { data, error } = await supabase.from("profiles")
        .update({ bio: draft, avatar_url: nextAvatar }).eq("user_id", user.id).select("id").single();
      if (error || !data) throw error ?? new Error(t("common.error"));
      uploadedPath = null;
      await invalidateProfile();
      toast.success(t("profile.saved"));
      onOpenChange(false);
    } catch {
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
      toast.error(t("profile.saveError"));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("profile.photoBio")}</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-24 w-24">
            <AvatarImage src={preview ?? avatarUrl ?? undefined} className="object-cover" />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <input ref={fileInput} type="file" accept="image/*" className="hidden"
            aria-label={t("profile.changePhoto")} disabled={saving}
            onChange={(event) => { choosePhoto(event.target.files?.[0]); event.target.value = ""; }} />
          <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={saving}>
            <Camera className="h-4 w-4" />{t("profile.changePhoto")}
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-bio">{t("profile.bio")}</Label>
          <Textarea id="profile-bio" value={draft} disabled={saving} rows={5}
            className="resize-none" onChange={(event) => setDraft(limitBio(event.target.value))} />
          <p className="text-right text-xs text-muted-foreground">{bioLength(draft)} / {BIO_MAX_LENGTH}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}