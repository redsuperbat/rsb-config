import {
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/solid-query";
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
  getConfigNames,
} from "./api/http-client";
import { useConfigService } from "./services/config-service";
import { ToastService } from "./services/toast-service";

const ConfigSelect: Component = () => {
  const { setCurrentConfigName, currentConfigName } = useConfigService();

  const configNames = createQuery(() => ["config-names"], getConfigNames, {
    refetchOnWindowFocus: false,
    onSuccess(data) {
      if (!data.length) return;
      setCurrentConfigName(data[0]);
    },
  });

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
        <div class="w-36">
          <DropdownButton
            onSelect={(e) => setCurrentConfigName(e)}
            title={currentConfigName() ?? "Select config"}
          >
            <For each={configNames.data}>
              {(it) => <Dropdown.Item eventKey={it}>{it}</Dropdown.Item>}
            </For>
          </DropdownButton>
        </div>
      </Match>
    </Switch>
  );
};

type Props = {
  onLogout: () => void;
};

export const Toolbar: Component<Props> = ({ onLogout }) => {
  const [createConfigName, setCreateConfigName] = createSignal("");
  const genApiKey = createMutation(generateApiKey);
  const client = useQueryClient();

  const createConfigMut = createMutation(createConfig, {
    onSuccess(_, name) {
      setCreateConfigName("");
      client.resetQueries({
        queryKey: ["config-names"],
        exact: true,
      });
      ToastService.show("Success", {
        body: `Successfully created config ${name}!`,
      });
    },
    onError(error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      ToastService.show("Error", {
        severity: "danger",
        body: message,
      });
    },
  });

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

      <header class="flex p-2 justify-between items-center">
        <ConfigSelect />

        <div class="flex gap-1">
          <Form.Control
            placeholder="Config name"
            onChange={(e) => setCreateConfigName(e.target.value)}
            value={createConfigName()}
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

        <SplitButton title="Save">
          <For each={items}>
            {(it) => (
              <Dropdown.Item onClick={it.command}>{it.label}</Dropdown.Item>
            )}
          </For>
        </SplitButton>
      </header>
    </>
  );
};
