type YouTubeEmbedProps = {
  videoId: string;
  title: string;
  className?: string;
};

export default function YouTubeEmbed({
  videoId,
  title,
  className,
}: YouTubeEmbedProps) {
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg ${className ?? ""}`}
      style={{ aspectRatio: "16 / 9", background: "rgba(255,255,255,0.04)" }}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}
