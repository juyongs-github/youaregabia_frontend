import Toast from "./Toast";

interface ConfirmToastState {
  message: string;
  type?: "success" | "error" | "info";
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
}

interface Props {
  state: ConfirmToastState | null;
  onClose: (result: boolean) => void;
}

export default function ConfirmToast({ state, onClose }: Props) {
  if (!state) return null;

  return (
    <Toast
      message={state.message}
      type={state.type ?? "info"}
      onClose={() => onClose(false)}
      duration={0}
      actions={[
        { label: state.cancelLabel ?? "취소", onClick: () => onClose(false), variant: "secondary" },
        {
          label: state.confirmLabel ?? "확인",
          onClick: () => onClose(true),
          variant: state.confirmVariant ?? "primary",
        },
      ]}
    />
  );
}
