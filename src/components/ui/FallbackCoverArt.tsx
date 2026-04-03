import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { FaMusic } from "react-icons/fa";

interface FallbackCoverArtProps {
  src?: string | null;
  title?: string;
  size: number | string;
  radius?: number;
  variant?: "review" | "collabo";
  className?: string;
}

const unifiedGradient =
  "linear-gradient(140deg, rgba(63,139,255,0.24), rgba(109,94,252,0.22), rgba(57,201,167,0.18))";

function FallbackCoverArt({
  src,
  title,
  size,
  radius = 14,
  variant = "review",
  className,
}: FallbackCoverArtProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const canShowImage = !!src && failedSrc !== src;
  const iconSize = useMemo(() => {
    if (typeof size === "number") {
      return size * 0.3;
    }

    return 36;
  }, [size, variant]);

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
    background: unifiedGradient,
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
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          textShadow: "0 2px 6px rgba(40,45,80,0.25)",
          opacity: 0.92,
        }}
      >
        <FaMusic size={iconSize} />
      </div>
    </div>
  );
}

export default FallbackCoverArt;
