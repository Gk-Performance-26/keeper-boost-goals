import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Crown, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { EXPERIENCE_LEVELS } from "@/lib/gamification";
import { cn } from "@/lib/utils";

type VideoType = "upload" | "youtube" | "vimeo";

interface Drill {
  title: string;
  reps: string;
  is_premium?: boolean;
}

const AdminTrainingForm = () => {
  const { id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [level, setLevel] = useState<string>("beginner");
  const [duration, setDuration] = useState(15);
  const [xpReward, setXpReward] = useState(50);
  const [videoType, setVideoType] = useState<VideoType>("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [equipment, setEquipment] = useState("");
  const [drills, setDrills] = useState<Drill[]>([{ title: "", reps: "" }]);
  const [isPublished, setIsPublished] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["admin-training", id],
    enabled: isEdit,
    queryFn: async () => {
      const { data, error } = await supabase.from("trainings").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title ?? "");
      setDescription(existing.description ?? "");
      setCategoryId(existing.category_id ?? "");
      setLevel(existing.level ?? "beginner");
      setDuration(existing.duration_minutes ?? 15);
      setXpReward(existing.xp_reward ?? 50);
      setVideoType((existing.video_type as VideoType) ?? "youtube");
      setVideoUrl(existing.video_url ?? "");
      setEquipment((existing.equipment ?? []).join(", "));
      const d = (existing.drills as unknown as Drill[]) ?? [];
      setDrills(
        d.length
          ? d.map((x) => ({ title: x.title ?? "", reps: x.reps ?? "", is_premium: !!x.is_premium }))
          : [{ title: "", reps: "", is_premium: false }],
      );
      setIsPublished(existing.is_published ?? true);
      setIsPremium((existing as any).is_premium ?? false);
    }
  }, [existing]);

  if (!user) return <Navigate to="/auth" replace />;
  if (adminLoading || (isEdit && loadingExisting)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin" replace />;

  const handleVideoFile = async (file: File) => {
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error("Ficheiro demasiado grande (máx 200MB).");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("training-videos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      toast.error("Falha no upload: " + upErr.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("training-videos").getPublicUrl(path);
    setVideoUrl(pub.publicUrl);
    setVideoType("upload");
    setUploading(false);
    toast.success("Vídeo carregado");
  };

  const save = async () => {
    if (!title.trim()) return toast.error("Título obrigatório");
    if (!videoUrl.trim()) return toast.error("Adiciona um vídeo");
    if (!categoryId) return toast.error("Escolhe uma categoria");

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId,
      level: level as any,
      duration_minutes: duration,
      xp_reward: xpReward,
      video_type: videoType as any,
      video_url: videoUrl.trim(),
      equipment: equipment
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      drills: drills
        .filter((d) => d.title.trim())
        .map((d) => ({ title: d.title.trim(), reps: d.reps, is_premium: !!d.is_premium })) as any,
      is_published: isPublished,
      is_premium: isPremium,
    };

    const { error } = isEdit
      ? await supabase.from("trainings").update(payload).eq("id", id!)
      : await supabase.from("trainings").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success(isEdit ? "Treino atualizado" : "Treino criado");
    navigate("/admin");
  };

  return (
    <div className="space-y-5 px-5 pt-8 pb-10">
      <header className="flex items-center gap-3">
        <Link to="/admin">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-2xl">{isEdit ? "Editar treino" : "Novo treino"}</h1>
      </header>

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolher" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nível</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duração (min)</Label>
              <Input
                type="number"
                min={1}
                max={240}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>XP recompensa</Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={xpReward}
                onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-4 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vídeo</p>
          <div className="grid grid-cols-3 gap-2">
            {(["upload", "youtube", "vimeo"] as VideoType[]).map((v) => (
              <button
                key={v}
                onClick={() => setVideoType(v)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition ${
                  videoType === v
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {videoType === "upload" ? (
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground transition hover:bg-muted/40">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> A carregar...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Escolher ficheiro de vídeo
                  </>
                )}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleVideoFile(f);
                  }}
                  disabled={uploading}
                />
              </label>
              {videoUrl && (
                <p className="break-all text-xs text-muted-foreground">URL: {videoUrl}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>URL embed ({videoType})</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={
                  videoType === "youtube"
                    ? "https://www.youtube.com/embed/..."
                    : "https://player.vimeo.com/video/..."
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Usa o link de "embed" (não o link normal de partilha).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label>Equipamento (separado por vírgulas)</Label>
            <Input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="bola, cones, parede"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Exercícios</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDrills([...drills, { title: "", reps: "", is_premium: false }])}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Marca individualmente quais exercícios são premium (úteis em treinos gratuitos com partes pagas).
            </p>
            {drills.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "space-y-2 rounded-lg border p-2.5 transition",
                  d.is_premium ? "border-primary/40 bg-primary/5" : "border-border/60 bg-muted/20",
                )}
              >
                <div className="flex gap-2">
                  <Input
                    placeholder="Título"
                    value={d.title}
                    onChange={(e) => {
                      const n = [...drills];
                      n[i].title = e.target.value;
                      setDrills(n);
                    }}
                  />
                  <Input
                    className="w-28"
                    placeholder="Reps"
                    value={d.reps}
                    onChange={(e) => {
                      const n = [...drills];
                      n[i].reps = e.target.value;
                      setDrills(n);
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="flex-shrink-0 text-destructive"
                    onClick={() => setDrills(drills.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Crown
                      className={cn(
                        "h-3.5 w-3.5",
                        d.is_premium ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span className={d.is_premium ? "font-semibold text-primary" : "text-muted-foreground"}>
                      {d.is_premium ? "Exercício Premium" : "Exercício gratuito"}
                    </span>
                  </div>
                  <Switch
                    checked={!!d.is_premium}
                    onCheckedChange={(v) => {
                      const n = [...drills];
                      n[i].is_premium = v;
                      setDrills(n);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
            <div>
              <p className="text-sm font-semibold">Publicado</p>
              <p className="text-xs text-muted-foreground">Visível para todos os utilizadores</p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Crown className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Exercício Premium</p>
                <p className="text-xs text-muted-foreground">
                  Apenas utilizadores com subscrição podem aceder
                </p>
              </div>
            </div>
            <Switch checked={isPremium} onCheckedChange={setIsPremium} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving || uploading} className="w-full" size="lg">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {isEdit ? "Guardar alterações" : "Criar treino"}
      </Button>
    </div>
  );
};

export default AdminTrainingForm;
