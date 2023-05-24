import { createSignal } from "solid-js";

type Toast = {
  header: string;
  body: string;
  severity?: "success" | "danger" | "warning";
  id: string;
};

const [showToast, setShowToast] = createSignal<Toast[]>([]);

export const ToastService = {
  show(
    header: string,
    options?: { body?: string; severity?: "success" | "danger" | "warning" }
  ) {
    const { severity = "success", body } = options ?? {};
    const id = Math.round(Math.random() * 100_000).toString();
    const data = { body, severity, header, id };
    setShowToast((it) => [...it, data]);

    setTimeout(
      () => setShowToast((it) => it.filter((it) => it.id !== data.id)),
      5000
    );
  },
  state: showToast,
};
