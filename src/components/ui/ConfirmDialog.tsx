interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "확인",
  cancelLabel = "취소",
}: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(80,90,140,0.28)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.82)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(80,90,140,0.18)",
          backdropFilter: "blur(24px)",
          padding: "28px 28px 22px",
          minWidth: 280,
          maxWidth: 360,
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1f2430", marginBottom: 22, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(92,103,151,0.08)",
              border: "1px solid rgba(92,103,151,0.16)",
              color: "#677086",
              transition: "background 0.15s",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              background: "linear-gradient(135deg, #6d5efc, #ff5ca8)",
              border: "none",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(109,94,252,0.22)",
              transition: "opacity 0.15s",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
