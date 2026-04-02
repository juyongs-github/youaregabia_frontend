import { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";

interface Props {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "info", onClose, duration = 2500 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const colors = {
    success: { icon: "#29a98a", bg: "rgba(56,199,170,0.12)", border: "rgba(56,199,170,0.22)" },
    error:   { icon: "#e0344a", bg: "rgba(255,92,122,0.10)", border: "rgba(255,92,122,0.22)" },
    info:    { icon: "#6d5efc", bg: "rgba(109,94,252,0.10)", border: "rgba(109,94,252,0.18)" },
  };

  const c = colors[type];

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "22px 28px",
        borderRadius: 20,
        background: "rgba(255,255,255,0.95)",
        border: `1px solid ${c.border}`,
        boxShadow: "0 24px 60px rgba(80,90,140,0.20)",
        backdropFilter: "blur(24px)",
        minWidth: 300,
        maxWidth: 440,
      }}
    >
      <span style={{ color: c.icon, flexShrink: 0, display: "flex" }}>
        {type === "success" ? <FaCheckCircle size={28} /> : <FaExclamationCircle size={28} />}
      </span>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: "#1f2430" }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#9199ad",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: 2,
          flexShrink: 0,
        }}
      >
        <FaTimes size={15} />
      </button>
    </div>
  );
}
