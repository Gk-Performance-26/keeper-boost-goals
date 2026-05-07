import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Timer } from "lucide-react";
import { useSignedVideoUrl } from "@/hooks/useSignedVideoUrl";

type VideoSource = "upload" | "youtube" | "vimeo" | "image";

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
  /** If true, when the intro ends jump straight to the exercise (no countdown). */
  skipCountdown?: boolean;
  /** Duration of the drill timer in seconds. Defaults to 20s. */
  exerciseDurationSeconds?: number;
  /** Number of sets per drill. Defaults to 1. */
  sets?: number;
  /** Rest duration between sets in seconds. Defaults to 15. */
  restSeconds?: number;
  /** If true, treat the main exercise video as a loopable timed drill (for non-drill players). */
  loopExercise?: boolean;
}

const DEFAULT_DRILL_DURATION_SECONDS = 20;

function buildAutoplayUrl(url: string, type: VideoSource, loop = false): string {
  if (type === "youtube") {
    const sep = url.includes("?") ? "&" : "?";
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
  skipCountdown = false,
  exerciseDurationSeconds,
  sets = 1,
  restSeconds = 15,
  loopExercise = false,
}: Props) {
  const hasIntro = !!introUrl;
  const isDrillField = mainField === "drill_exercise";
  const isDrill = isDrillField || loopExercise;
  const DRILL_DURATION_SECONDS = exerciseDurationSeconds ?? DEFAULT_DRILL_DURATION_SECONDS;
  const totalSets = Math.max(1, sets);
  const restDuration = Math.max(0, restSeconds);
  const [phase, setPhase] = useState<"intro" | "countdown" | "exercise" | "rest">(
    hasIntro ? "intro" : "exercise",
  );
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const exerciseVideoRef = useRef<HTMLVideoElement>(null);

  const COUNTDOWN_SECONDS = 5;
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const [currentSet, setCurrentSet] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(DRILL_DURATION_SECONDS);
  const [restLeft, setRestLeft] = useState(restDuration);
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
    enabled: !(isDrillField && hasIntro),
  });
  const main = isDrillField && hasIntro
    ? { data: intro.data, isLoading: intro.isLoading, isError: intro.isError }
    : mainSigned;
  const exerciseType: VideoSource =
    isDrillField && hasIntro ? ((introType ?? "upload") as VideoSource) : type;

  useEffect(() => {
    setPhase(hasIntro ? "intro" : "exercise");
    setCountdown(COUNTDOWN_SECONDS);
    setCurrentSet(1);
  }, [introUrl, hasIntro]);

  // Intro -> exercise countdown
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

  // Exercise timer
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
        const v = exerciseVideoRef.current;
        if (v) v.pause();

        // If more sets remaining, go to rest (or directly next set if no rest)
        if (currentSet < totalSets) {
          if (restDuration > 0) {
            setPhase("rest");
          } else {
            setCurrentSet((s) => s + 1);
            setPhase("exercise");
          }
        } else {
          onAllEnded?.();
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isDrill, phase, main.data, currentSet, totalSets, restDuration, DRILL_DURATION_SECONDS]);

  // Rest timer
  useEffect(() => {
    if (phase !== "rest") return;
    setRestLeft(restDuration);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, restDuration - elapsed);
      setRestLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        setCurrentSet((s) => s + 1);
        setPhase("exercise");
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, restDuration]);

  const restartDrill = () => {
    setCurrentSet(1);
    setSecondsLeft(DRILL_DURATION_SECONDS);
    setTimerDone(false);
    setPhase("exercise");
    const v = exerciseVideoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const skipRest = () => {
    setCurrentSet((s) => s + 1);
    setPhase("exercise");
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
    if (vType === "image") {
      return <img src={vUrl} alt="" className="aspect-video w-full rounded-2xl bg-black object-cover" />;
    }
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
          key={vUrl + "-set-" + currentSet}
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
          key={vUrl + (autoplay ? "-auto" : "") + (loop ? "-loop" : "") + "-set-" + currentSet}
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
    if (!isDrillField || (phase !== "exercise" && phase !== "rest")) return null;
    if (phase === "rest") {
      const pct = restDuration > 0 ? (restLeft / restDuration) * 100 : 0;
      return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <div className="flex items-center gap-2 text-amber-500">
            <Timer className="h-4 w-4" />
            <span className="font-display text-base tabular-nums">
              Descanso {String(restLeft).padStart(2, "0")}s
            </span>
          </div>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-amber-500/15">
            <div className="absolute inset-y-0 left-0 bg-amber-500 transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
          <button type="button" onClick={skipRest} className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-black">
            ▶
          </button>
        </div>
      );
    }
    const pct = (secondsLeft / DRILL_DURATION_SECONDS) * 100;
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
        <div className="flex items-center gap-2 text-primary">
          <Timer className="h-4 w-4" />
          <span className="font-display text-base tabular-nums">
            {String(secondsLeft).padStart(2, "0")}s
          </span>
          {totalSets > 1 && (
            <span className="text-xs text-muted-foreground">
              · Série {currentSet}/{totalSets}
            </span>
          )}
        </div>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15">
          <div className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
        {timerDone && currentSet >= totalSets && (
          <button type="button" onClick={restartDrill} className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
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
        {phase === "rest" ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-500/20 via-black to-black text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-500">Descanso</p>
            <span className="font-display text-5xl tabular-nums text-amber-500">{restLeft}</span>
            <p className="text-xs text-muted-foreground">Próxima série em breve</p>
          </div>
        ) : (
          renderPlayer(main.data, type, isDrill, isDrill ? undefined : onAllEnded, {
            loop: isDrill,
            isExercise: isDrill,
          })
        )}
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
            phase === "exercise" || phase === "rest"
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
          renderPlayer(intro.data, (introType ?? "upload") as VideoSource, true, () => {
            if (skipCountdown) {
              onAllEnded?.();
            } else {
              setPhase("countdown");
            }
          })
        )
      ) : phase === "countdown" ? (
        <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-black to-black text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.25),transparent_60%)]" />
          <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            {exerciseLabel}
          </p>
          <div
            key={countdown}
            className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10 shadow-[0_0_30px_hsl(var(--primary)/0.5)] animate-in zoom-in-50 duration-300"
          >
            <span className="font-display text-4xl leading-none tabular-nums text-primary drop-shadow-[0_0_15px_hsl(var(--primary))]">
              {countdown}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPhase("exercise")}
            className="relative z-10 mt-1 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            ▶ Saltar
          </button>
        </div>
      ) : phase === "rest" ? (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-500/20 via-black to-black text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-500">Descanso</p>
          <span className="font-display text-5xl tabular-nums text-amber-500">{restLeft}</span>
          <p className="text-xs text-muted-foreground">Próxima série: {currentSet + 1}/{totalSets}</p>
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
