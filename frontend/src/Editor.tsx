import { createMutation, createQuery } from "@tanstack/solid-query";
import { editor } from "monaco-editor";
import {
  Button,
  Dropdown,
  DropdownButton,
  Form,
  Modal,
  Spinner,
  SplitButton,
} from "solid-bootstrap";
import { Component, For, Match, Switch, createSignal } from "solid-js";
import {
  createConfig,
  generateApiKey,
  getConfigByName,
  getConfigNames,
  setConfigByName,
} from "./api/http-client";
import { ToastService } from "./services/toast-service";

type Props = {
  onLogout: () => void;
};

export const ConfigEditor: Component<Props> = ({ onLogout }) => {
  // const editorRef = useRef<editor.ICodeEditor>();
  const [value, setValue] = createSignal("");
  const [selectedConfig, setSelectedConfig] = createSignal<string>();
  const [createConfigName, setCreateConfigName] = createSignal("");
  const genApiKey = createMutation(generateApiKey);

  const items = [
    {
      label: "Logout",
      command: () => onLogout(),
    },
    {
      label: "Generate Api Key",
      command: () => genApiKey.mutateAsync(),
    },
  ];

  createQuery(
    () => ["config-data", selectedConfig],
    ({ queryKey }) => {
      const key = queryKey.at(0);
      return getConfigByName(typeof key === "string" ? key : key());
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!selectedConfig(),
      onSuccess(data) {
        setValue(data);
      },
    }
  );

  const configNames = createQuery(() => ["config-names"], getConfigNames, {
    refetchOnWindowFocus: false,
    onSuccess(data) {
      if (!data.length) return;
      setSelectedConfig(data[0]);
    },
  });
  // Mutations
  const setConfig = createMutation(
    async () => {
      const editorValue = "";
      if (!editorValue) return;
      if (editorValue === value) return;
      if (!selectedConfig) return;
      JSON.parse(editorValue);
      return setConfigByName(selectedConfig(), editorValue);
    },
    {
      onSuccess() {
        ToastService.show("Success", {
          body: `Config ${selectedConfig} updated!`,
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

  const createConfigMut = createMutation(createConfig, {
    onSuccess(_, name) {
      console.log({ name });
      configNames.refetch();
      ToastService.show("Success", {
        body: `Successfully created config ${name}!`,
      });

      setCreateConfigName("");
    },
    onError(error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log({ message });

      ToastService.show("Error", {
        severity: "danger",
        body: message,
      });
    },
  });

  const ConfigSelect = () => {
    return (
      <Switch>
        <Match when={configNames.isLoading}>
          <div class="w-7 h-7">
            <Spinner animation="border" />
          </div>
        </Match>
        <Match when={configNames.isError}>
          <div>Unable to fetch config names</div>
        </Match>
        <Match when={configNames.data}>
          <DropdownButton
            onSelect={(e) => setSelectedConfig(e)}
            title="Select config"
          >
            <For each={configNames.data}>
              {(it) => <Dropdown.Item eventKey={it}>{it}</Dropdown.Item>}
            </For>
          </DropdownButton>
        </Match>
      </Switch>
    );
  };

  function handleEditorDidMount(editor: editor.ICodeEditor) {
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
        <Modal.Body>
          <h4>API Key</h4>
          <p>Save the api key in a safe place. It will not be shown again.</p>
          <div class="bg-gray-800 p-4 rounded-md">
            <pre class="text-white font-mono mb-0">
              <code class="whitespace-pre-wrap">{genApiKey.data?.apiKey}</code>
            </pre>
          </div>
        </Modal.Body>
      </Modal>
      <div class="p-2 bg-slate-100">
        <header class="flex mb-2 justify-between items-center">
          <ConfigSelect />

          <div class="flex gap-1">
            <Form.Control
              placeholder="Config name"
              onChange={(e) => setCreateConfigName(e.target.value)}
            />
            <Button
              class="whitespace-nowrap"
              onClick={() => createConfigMut.mutate(createConfigName())}
            >
              <Spinner
                as="span"
                animation="border"
                hidden={!createConfigMut.isLoading}
              />
              Create new config
            </Button>
          </div>

          <SplitButton title="Save" onClick={() => setConfig.mutateAsync()}>
            <For each={items}>
              {(it) => (
                <Dropdown.Item onClick={it.command}>{it.label}</Dropdown.Item>
              )}
            </For>
          </SplitButton>
        </header>
        <div class="border">
          {/* {editor.}
          <Editor
            height="90vh"
            defaultLanguage="json"
            value={value}
            defaultValue={value}
            onMount={handleEditorDidMount}
          /> */}
        </div>
      </div>
    </>
  );
};
