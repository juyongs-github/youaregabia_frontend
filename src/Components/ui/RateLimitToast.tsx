import { useEffect, useState } from "react";

interface Props {
  remainSeconds: number;
  message: string;
  onClose: () => void;
}

export default function RateLimitToast({ remainSeconds, message, onClose }: Props) {
  const [seconds, setSeconds] = useState(remainSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onClose();
      return;
    }
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  // 초 단위를 분:초 형식으로 변환 (10분이면 600초이므로 보기 편하게)
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#ef4444",
        color: "#fff",
        padding: "14px 24px",
        borderRadius: "12px",
        fontSize: "15px",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span>{message}</span>
      <span
        style={{
          background: "rgba(255,255,255,0.25)",
          borderRadius: "8px",
          padding: "2px 10px",
          fontWeight: "bold",
          fontSize: "16px",
          minWidth: "40px",
          textAlign: "center",
        }}
      >
        {formatTime(seconds)}
      </span>
      {/* 닫기 버튼 (X) */}
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "20px",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.8,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
      >
        ✕
      </button>
    </div>
  );
}
