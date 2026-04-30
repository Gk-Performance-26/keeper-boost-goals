import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Timer } from "lucide-react";
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
  /** Called when the exercise video finishes (or drill timer ends). */
  onAllEnded?: () => void;
}

const DRILL_DURATION_SECONDS = 20;

function buildAutoplayUrl(url: string, type: VideoSource, loop = false): string {
  if (type === "youtube") {
    const sep = url.includes("?") ? "&" : "?";
    // YouTube loop requires playlist=<videoId>
    let extra = `autoplay=1&rel=0&mute=1`;
    if (loop) {
      const m = url.match(/(?:embed\/|v=|youtu\.be\/)([\w-]+)/);
      const vid = m?.[1];
      extra += `&loop=1${vid ? `&playlist=${vid}` : ""}`;
    }
    return `${url}${sep}${extra}`;
  }
  if (type === "vimeo") {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}autoplay=1&muted=1${loop ? "&loop=1" : ""}`;
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
  onAllEnded,
}: Props) {
  const hasIntro = !!introUrl;
  const isDrill = mainField === "drill_exercise";
  const [phase, setPhase] = useState<"intro" | "countdown" | "exercise">(
    hasIntro ? "intro" : "exercise",
  );
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const exerciseVideoRef = useRef<HTMLVideoElement>(null);

  // Countdown between intro and exercise
  const COUNTDOWN_SECONDS = 5;
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  // Drill timer state (only active when isDrill && phase === 'exercise')
  const [secondsLeft, setSecondsLeft] = useState(DRILL_DURATION_SECONDS);
  const [timerDone, setTimerDone] = useState(false);

  const intro = useSignedVideoUrl({
    trainingId,
    field: introField,
    drillIndex,
    type: (introType ?? "upload") as VideoSource,
    fallbackUrl: introUrl ?? null,
    enabled: hasIntro,
  });
  const mainSigned = useSignedVideoUrl({
    trainingId,
    field: mainField,
    drillIndex,
    type,
    fallbackUrl: url,
    // For drills with an intro, reuse the intro video as the exercise loop
    enabled: !(isDrill && hasIntro),
  });
  // For drills with intro: exercise = same intro video (looped 20s)
  const main = isDrill && hasIntro
    ? {
        data: intro.data,
        isLoading: intro.isLoading,
        isError: intro.isError,
      }
    : mainSigned;
  const exerciseType: VideoSource =
    isDrill && hasIntro ? ((introType ?? "upload") as VideoSource) : type;

  // Reset phase when intro changes (e.g. switching trainings)
  useEffect(() => {
    setPhase(hasIntro ? "intro" : "exercise");
    setCountdown(COUNTDOWN_SECONDS);
  }, [introUrl, hasIntro]);

  // Run countdown between intro and exercise
  useEffect(() => {
    if (phase !== "countdown") return;
    setCountdown(COUNTDOWN_SECONDS);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, COUNTDOWN_SECONDS - elapsed);
      setCountdown(left);
      if (left <= 0) {
        clearInterval(interval);
        setPhase("exercise");
      }
    }, 200);
    return () => clearInterval(interval);
  }, [phase]);

  // Reset & run countdown when entering exercise phase on a drill
  useEffect(() => {
    if (!isDrill) return;
    if (phase !== "exercise") {
      setSecondsLeft(DRILL_DURATION_SECONDS);
      setTimerDone(false);
      return;
    }
    setSecondsLeft(DRILL_DURATION_SECONDS);
    setTimerDone(false);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, DRILL_DURATION_SECONDS - elapsed);
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        setTimerDone(true);
        // pause uploaded video when timer finishes
        const v = exerciseVideoRef.current;
        if (v) {
          v.pause();
        }
        onAllEnded?.();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isDrill, phase, main.data]);

  const restartDrill = () => {
    setSecondsLeft(DRILL_DURATION_SECONDS);
    setTimerDone(false);
    const v = exerciseVideoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

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
    opts?: { loop?: boolean; isExercise?: boolean },
  ) => {
    const loop = !!opts?.loop;
    if (vType === "upload") {
      return (
        <video
          ref={
            opts?.isExercise
              ? exerciseVideoRef
              : autoplay && phase === "intro"
              ? introVideoRef
              : undefined
          }
          key={vUrl}
          src={vUrl}
          controls
          autoPlay={autoplay}
          loop={loop}
          muted={loop}
          playsInline
          preload="auto"
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
          key={vUrl + (autoplay ? "-auto" : "") + (loop ? "-loop" : "")}
          src={autoplay ? buildAutoplayUrl(vUrl, vType, loop) : vUrl}
          title="Training video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  const renderTimerBadge = () => {
    if (!isDrill || phase !== "exercise") return null;
    const pct = (secondsLeft / DRILL_DURATION_SECONDS) * 100;
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
        <div className="flex items-center gap-2 text-primary">
          <Timer className="h-4 w-4" />
          <span className="font-display text-base tabular-nums">
            {String(secondsLeft).padStart(2, "0")}s
          </span>
        </div>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15">
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        {timerDone && (
          <button
            type="button"
            onClick={restartDrill}
            className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
          >
            ↻
          </button>
        )}
      </div>
    );
  };

  if (!hasIntro) {
    if (main.isLoading) return renderLoading();
    if (main.isError || !main.data) return renderError();
    return (
      <div className="space-y-2">
        {renderPlayer(main.data, type, isDrill, isDrill ? undefined : onAllEnded, {
          loop: isDrill,
          isExercise: isDrill,
        })}
        {renderTimerBadge()}
      </div>
    );
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

      {phase === "intro" ? (
        intro.isLoading ? (
          renderLoading()
        ) : intro.isError || !intro.data ? (
          renderError()
        ) : (
          renderPlayer(intro.data, (introType ?? "upload") as VideoSource, true, () =>
            setPhase("countdown"),
          )
        )
      ) : phase === "countdown" ? (
        <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-black text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {exerciseLabel}
          </p>
          <p className="font-display text-7xl tabular-nums text-primary-foreground drop-shadow-[0_0_20px_hsl(var(--primary))]">
            {countdown}
          </p>
          <button
            type="button"
            onClick={() => setPhase("exercise")}
            className="mt-1 rounded-full bg-primary/20 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/30"
          >
            ▶ Saltar
          </button>
        </div>
      ) : main.isLoading ? (
        renderLoading()
      ) : main.isError || !main.data ? (
        renderError()
      ) : (
        renderPlayer(main.data, exerciseType, true, isDrill ? undefined : onAllEnded, {
          loop: isDrill,
          isExercise: isDrill,
        })
      )}

      {renderTimerBadge()}
    </div>
  );
}
