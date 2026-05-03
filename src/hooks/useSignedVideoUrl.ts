import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VideoFieldKey =
  | "main"
  | "intro"
  | "drill_intro"
  | "drill_exercise";

interface Args {
  trainingId: string | undefined;
  field: VideoFieldKey;
  drillIndex?: number;
  /** Only call the function for "upload" videos. YouTube/Vimeo are returned untouched. */
  type: "upload" | "youtube" | "vimeo" | "image" | null | undefined;
  /** Original URL (used directly when type !== "upload"). */
  fallbackUrl: string | null | undefined;
  enabled?: boolean;
}

/**
 * Returns a usable video URL for a training video.
 * - For "upload" videos: calls the sign-training-video edge function which
 *   enforces subscription / admin / public-training checks server-side and
 *   returns a short-lived signed URL from the private bucket.
 * - For "youtube" / "vimeo": returns the original URL.
 */
export function useSignedVideoUrl({
  trainingId,
  field,
  drillIndex,
  type,
  fallbackUrl,
  enabled = true,
}: Args) {
  return useQuery({
    queryKey: [
      "signed-training-video",
      trainingId,
      field,
      drillIndex ?? null,
      type,
      fallbackUrl,
    ],
    enabled: !!trainingId && !!fallbackUrl && enabled,
    staleTime: 50 * 60 * 1000, // signed URL is valid for 60 minutes
    queryFn: async () => {
      if (type !== "upload" && type !== "image") {
        return fallbackUrl ?? null;
      }
      const { data, error } = await supabase.functions.invoke(
        "sign-training-video",
        {
          body: {
            training_id: trainingId,
            field,
            drill_index: drillIndex,
          },
        },
      );
      if (error) throw error;
      const url = (data as { url?: string } | null)?.url;
      if (!url) throw new Error("Signed URL missing");
      return url;
    },
  });
}
