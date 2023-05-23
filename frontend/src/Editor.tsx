import { createMutation, createQuery } from "@tanstack/solid-query";
import { editor } from "monaco-editor";
import { MenuItem } from "primereact/menuitem";
import { ProgressSpinner } from "primereact/progressspinner";
import { SplitButton } from "primereact/splitbutton";
import { Toast } from "primereact/toast";
import { FC, useRef, useState } from "react";
import { Button, Dropdown, DropdownButton, Form, Modal } from "solid-bootstrap";
import { For } from "solid-js";
import {
  createConfig,
  generateApiKey,
  getConfigByName,
  getConfigNames,
  setConfigByName,
} from "./api/http-client";

type Props = {
  onLogout: () => void;
};

export const ConfigEditor: FC<Props> = ({ onLogout }) => {
  const editorRef = useRef<editor.ICodeEditor>();
  const toast = useRef<Toast>(null);
  const [value, setValue] = useState("");
  const [selectedConfig, setSelectedConfig] = useState<string>();
  const [createConfigName, setCreateConfigName] = useState<string>("");
  const genApiKey = createMutation(generateApiKey);

  const items: MenuItem[] = [
    {
      label: "Logout",
      icon: "pi pi-sign-out",
      command: () => onLogout(),
    },
    {
      label: "Generate Api Key",
      icon: "pi pi-sitemap",
      command: () => genApiKey.mutateAsync(),
    },
  ];

  createQuery(
    () => ["config-data", selectedConfig],
    ({ queryKey }) => getConfigByName(queryKey[1]!),
    {
      refetchOnWindowFocus: false,
      enabled: !!selectedConfig,
      onSuccess(data) {
        setValue(data);
      },
    }
  );

  const configNames = createQuery(() => ["config-names"], getConfigNames, {
    refetchOnWindowFocus: false,
    onSuccess(data) {
      setSelectedConfig(data[0]);
    },
  });
  // Mutations
  const setConfig = createMutation(
    async () => {
      const editorValue = editorRef.current?.getValue();
      if (!editorValue) return;
      if (editorValue === value) return;
      if (!selectedConfig) return;
      JSON.parse(editorValue);
      return setConfigByName(selectedConfig, editorValue);
    },
    {
      onSuccess() {
        toast?.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Config ${selectedConfig} updated!`,
          life: 3000,
        });
      },
      onError(error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        toast?.current?.show({
          severity: "error",
          summary: "Error",
          detail: `Unable to update config because of: [${message}]`,
          life: 3000,
        });
      },
    }
  );

  const createConfigMut = createMutation(
    (configName: string) => createConfig(configName),
    {
      onSuccess(_, name) {
        configNames.refetch();
        toast?.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Successfully created config ${name}!`,
          life: 3000,
        });

        setCreateConfigName("");
      },
      onError(error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        toast?.current?.show({
          severity: "error",
          summary: "Error",
          detail: message,
          life: 3000,
        });
      },
    }
  );

  const ConfigSelect = () => {
    if (configNames.isLoading) {
      return (
        <div class="w-7 h-7">
          <ProgressSpinner
            style={{ width: "28px", height: "28px" }}
            strokeWidth="8"
            animationDuration=".5s"
          />
        </div>
      );
    }

    if (!configNames.data) {
      return <div>Unable to fetch config names</div>;
    }

    return (
      <DropdownButton
        onSelect={(e) => setSelectedConfig(e)}
        title="Select config"
      >
        <For each={configNames.data}>
          {(it) => <Dropdown.Item eventKey={it}>{it}</Dropdown.Item>}
        </For>
      </DropdownButton>
    );
  };

  function handleEditorDidMount(editor: editor.ICodeEditor) {
    editorRef.current = editor;
    editor.onKeyDown((e) => {
      if (!e.metaKey) return;
      if (e.keyCode !== 49) return;
      e.preventDefault();
      setConfig.mutate();
    });
  }

  return (
    <>
      <Modal show={!!genApiKey.data} centered onHide={() => genApiKey.reset()}>
        <h1 class="mb-5">
          Save the api key in a safe place. It will not be shown again.
        </h1>
        <div class="bg-gray-800 p-4 rounded-md">
          <pre class="text-white font-mono">
            <code class="whitespace-pre-wrap">{genApiKey.data?.apiKey}</code>
          </pre>
        </div>
      </Modal>
      <div class="p-2 bg-slate-100">
        <Toast ref={toast} />
        <header class="flex mb-2 justify-between items-center">
          <ConfigSelect />

          <div class="flex gap-1">
            <Form.Control
              placeholder="Config name"
              onChange={(e) => setCreateConfigName(e.target.value)}
            />
            <Button onClick={() => createConfigMut.mutate(createConfigName)}>
              Create config
            </Button>
          </div>

          <SplitButton
            label="Save"
            icon="pi pi-check"
            model={items}
            onClick={() => setConfig.mutateAsync()}
          />
        </header>
        <div class="border">
          <Editor
            height="90vh"
            defaultLanguage="json"
            value={value}
            defaultValue={value}
            onMount={handleEditorDidMount}
          />
        </div>
      </div>
    </>
  );
};
