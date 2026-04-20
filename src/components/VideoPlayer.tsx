interface Props {
  url: string;
  type: "upload" | "youtube" | "vimeo";
  thumbnail?: string | null;
}

export function VideoPlayer({ url, type }: Props) {
  if (type === "upload") {
    return (
      <video src={url} controls className="aspect-video w-full rounded-2xl bg-black object-cover">
        Your browser does not support video playback.
      </video>
    );
  }
  // youtube / vimeo embed
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        src={url}
        title="Training video"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
