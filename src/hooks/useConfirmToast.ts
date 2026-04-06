import { useCallback, useRef, useState } from "react";

type ConfirmType = "success" | "error" | "info";

interface ConfirmOptions {
  type?: ConfirmType;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
}

interface ConfirmToastState extends ConfirmOptions {
  message: string;
}

export function useConfirmToast() {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [confirmToast, setConfirmToast] = useState<ConfirmToastState | null>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setConfirmToast({ message, ...options });
    });
  }, []);

  const closeConfirm = useCallback((result: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setConfirmToast(null);
    resolve?.(result);
  }, []);

  return { confirmToast, confirm, closeConfirm };
}
