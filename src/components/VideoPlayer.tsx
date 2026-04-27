import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useSignedVideoUrl } from "@/hooks/useSignedVideoUrl";

type VideoSource = "upload" | "youtube" | "vimeo";

interface Props {
  trainingId: string;
  url: string;
  type: VideoSource;
  thumbnail?: string | null;
  introUrl?: string | null;
  introType?: VideoSource | null;
  introLabel?: string;
  exerciseLabel?: string;
  /** Optional drill index when used for a drill. */
  drillIndex?: number;
  /** Override the default field keys for non-main contexts (drills). */
  mainField?: "main" | "drill_exercise";
  introField?: "intro" | "drill_intro";
}

function buildAutoplayUrl(url: string, type: VideoSource): string {
  if (type === "youtube") {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}autoplay=1&rel=0`;
  }
  if (type === "vimeo") {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}autoplay=1`;
  }
  return url;
}

export function VideoPlayer({
  trainingId,
  url,
  type,
  introUrl,
  introType,
  introLabel = "Explicação",
  exerciseLabel = "Exercício",
  drillIndex,
  mainField = "main",
  introField = "intro",
}: Props) {
  const hasIntro = !!introUrl;
  const [phase, setPhase] = useState<"intro" | "exercise">(hasIntro ? "intro" : "exercise");
  const introVideoRef = useRef<HTMLVideoElement>(null);

  const main = useSignedVideoUrl({
    trainingId,
    field: mainField,
    drillIndex,
    type,
    fallbackUrl: url,
  });
  const intro = useSignedVideoUrl({
    trainingId,
    field: introField,
    drillIndex,
    type: (introType ?? "upload") as VideoSource,
    fallbackUrl: introUrl ?? null,
    enabled: hasIntro,
  });

  // Reset phase when intro changes (e.g. switching trainings)
  useEffect(() => {
    setPhase(hasIntro ? "intro" : "exercise");
  }, [introUrl, hasIntro]);

  const renderLoading = () => (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-black">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  const renderError = (msg?: string) => (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-black p-4 text-center text-sm text-muted-foreground">
      {msg ?? "Could not load video"}
    </div>
  );

  const renderPlayer = (
    vUrl: string,
    vType: VideoSource,
    autoplay = false,
    onEnded?: () => void,
  ) => {
    if (vType === "upload") {
      return (
        <video
          ref={autoplay && phase === "intro" ? introVideoRef : undefined}
          key={vUrl}
          src={vUrl}
          controls
          autoPlay={autoplay}
          onEnded={onEnded}
          className="aspect-video w-full rounded-2xl bg-black object-cover"
        >
          Your browser does not support video playback.
        </video>
      );
    }
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          key={vUrl + (autoplay ? "-auto" : "")}
          src={autoplay ? buildAutoplayUrl(vUrl, vType) : vUrl}
          title="Training video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  if (!hasIntro) {
    if (main.isLoading) return renderLoading();
    if (main.isError || !main.data) return renderError();
    return renderPlayer(main.data, type);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPhase("intro")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            phase === "intro"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Sparkles className="h-3 w-3" /> {introLabel}
        </button>
        <button
          onClick={() => setPhase("exercise")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            phase === "exercise"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          ▶ {exerciseLabel}
        </button>
      </div>

      {phase === "intro"
        ? intro.isLoading
          ? renderLoading()
          : intro.isError || !intro.data
          ? renderError()
          : renderPlayer(intro.data, (introType ?? "upload") as VideoSource, false, () =>
              setPhase("exercise"),
            )
        : main.isLoading
        ? renderLoading()
        : main.isError || !main.data
        ? renderError()
        : renderPlayer(main.data, type, true)}
    </div>
  );
}
