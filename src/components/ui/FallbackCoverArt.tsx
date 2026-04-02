import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { FaMusic } from "react-icons/fa";
import { RiPlayList2Fill } from "react-icons/ri";

type CoverVariant = "review" | "collabo";

interface FallbackCoverArtProps {
  src?: string | null;
  title?: string;
  size: number;
  radius?: number;
  variant?: CoverVariant;
  className?: string;
}

const gradients: Record<CoverVariant, string> = {
  review: "linear-gradient(140deg, rgba(109,94,252,0.24), rgba(255,92,168,0.22), rgba(90,201,255,0.20))",
  collabo: "linear-gradient(140deg, rgba(63,139,255,0.24), rgba(109,94,252,0.22), rgba(57,201,167,0.18))",
};

function getInitials(title?: string) {
  if (!title) return "PL";
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

function FallbackCoverArt({
  src,
  title,
  size,
  radius = 14,
  variant = "review",
  className,
}: FallbackCoverArtProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = useMemo(() => getInitials(title), [title]);
  const canShowImage = !!src && failedSrc !== src;

  if (canShowImage) {
    return (
      <img
        src={src}
        alt={title ?? "playlist cover"}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
        }}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  const baseStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: "hidden",
    position: "relative",
    background: gradients[variant],
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 18px rgba(80,90,140,0.12)",
  };

  return (
    <div className={className} style={baseStyle} aria-label="fallback cover image">
      <div
        style={{
          position: "absolute",
          inset: -18,
          background:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25), transparent 40%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          padding: "2px 7px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          color: "#4b4f76",
          background: "rgba(255,255,255,0.56)",
          border: "1px solid rgba(255,255,255,0.68)",
        }}
      >
        {initials}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          textShadow: "0 2px 6px rgba(40,45,80,0.25)",
          opacity: 0.92,
        }}
      >
        {variant === "collabo" ? <RiPlayList2Fill size={size * 0.34} /> : <FaMusic size={size * 0.30} />}
      </div>
    </div>
  );
}

export default FallbackCoverArt;
