import { createMutation, createQuery } from "@tanstack/solid-query";
import { createSignal } from "solid-js";
import { getConfigByName, setConfigByName } from "../api/http-client";
import { ToastService } from "./toast-service";

const [currentConfigName, setCurrentConfigName] = createSignal<string>();
const [editingConfig, setEditingConfig] = createSignal<string>();

export const useConfigService = () => {
  createQuery(
    () => ["config-data", currentConfigName()] as const,
    ({ queryKey }) => getConfigByName(queryKey.at(1)),
    {
      refetchOnWindowFocus: false,
      get enabled() {
        return !!currentConfigName();
      },
      onSuccess(data) {
        setEditingConfig(data);
      },
    }
  );
  const updateConfig = createMutation(
    (config: string) =>
      setConfigByName({
        configName: currentConfigName(),
        config,
      }),
    {
      onSuccess() {
        ToastService.show("Success", {
          body: `Config ${currentConfigName()} updated!`,
        });
      },
      onError(error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        ToastService.show("Error", {
          severity: "danger",
          body: `Unable to update config because of: [${message}]`,
        });
      },
    }
  );

  return {
    currentConfigName,
    setCurrentConfigName,
    updateConfig,
    editingConfig,
    setEditingConfig,
  };
};
