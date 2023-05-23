import { createSignal } from "solid-js";

const [showToast, setShowToast] = createSignal<{
  header?: string;
  body?: string;
  show: boolean;
  severity?: "success" | "danger" | "warning";
}>({ show: false });

export const ToastService = {
  show(
    header: string,
    options?: { body?: string; severity?: "success" | "danger" | "warning" }
  ) {
    const { severity = "success", body } = options ?? {};
    setShowToast({ show: true, header, body, severity });
    setTimeout(() => setShowToast({ show: false }), 5000);
  },
  state: showToast,
};
