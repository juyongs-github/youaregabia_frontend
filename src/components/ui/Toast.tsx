import { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}

interface Props {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
  actions?: ToastAction[];
}

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 2500,
  actions,
}: Props) {
  useEffect(() => {
    if ((actions?.length ?? 0) > 0 || duration <= 0) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [actions, onClose, duration]);

  const colors = {
    success: { icon: "#29a98a", bg: "rgba(56,199,170,0.12)", border: "rgba(56,199,170,0.22)" },
    error:   { icon: "#e0344a", bg: "rgba(255,92,122,0.10)", border: "rgba(255,92,122,0.22)" },
    info:    { icon: "#6d5efc", bg: "rgba(109,94,252,0.10)", border: "rgba(109,94,252,0.18)" },
  };

  const c = colors[type];
  const actionColors = {
    primary: {
      background: "#6d5efc",
      border: "1px solid rgba(109,94,252,0.24)",
      color: "#ffffff",
    },
    secondary: {
      background: "rgba(255,255,255,0.9)",
      border: "1px solid rgba(195,198,205,0.72)",
      color: "#4d5564",
    },
    danger: {
      background: "#e0344a",
      border: "1px solid rgba(224,52,74,0.28)",
      color: "#ffffff",
    },
  } as const;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: actions?.length ? "rgba(31, 36, 48, 0.16)" : "transparent",
        display: "flex",
        alignItems: actions?.length ? "center" : "flex-end",
        justifyContent: "center",
        padding: "24px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: actions?.length ? "flex-start" : "center",
          gap: 10,
          padding: "22px 28px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.95)",
          border: `1px solid ${c.border}`,
          boxShadow: "0 24px 60px rgba(80,90,140,0.20)",
          backdropFilter: "blur(24px)",
          minWidth: 300,
          maxWidth: 440,
          pointerEvents: "auto",
        }}
      >
        <span
          style={{
            color: c.icon,
            flexShrink: 0,
            display: "flex",
            marginTop: actions?.length ? 2 : 0,
          }}
        >
          {type === "success" ? <FaCheckCircle size={28} /> : <FaExclamationCircle size={28} />}
        </span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: actions?.length ? 14 : 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1f2430" }}>{message}</span>
          {actions && actions.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {actions.map((action) => {
                const variant = action.variant ?? "primary";
                return (
                  <button
                    key={`${action.label}-${variant}`}
                    onClick={action.onClick}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "transform 0.15s ease, opacity 0.15s ease",
                      ...actionColors[variant],
                    }}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
