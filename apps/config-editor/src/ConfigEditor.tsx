import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { useMutation, useQuery } from "react-query";
import {
  createConfig,
  getConfigByName,
  getConfigNames,
  setConfigByName,
} from "./api";

export const ConfigEditor = () => {
  const editorRef = useRef<editor.ICodeEditor>();
  const toast = useRef<Toast>(null);
  const [value, setValue] = useState("");
  const [selectedConfig, setSelectedConfig] = useState<string>();
  const [createConfigName, setCreateConfigName] = useState<string>("");

  useQuery(
    ["config-data", selectedConfig],
    ({ queryKey }) => getConfigByName(queryKey[1]!),
    {
      enabled: !!selectedConfig,
      onSuccess(data) {
        setValue(data);
      },
    }
  );

  const configNames = useQuery("config-names", getConfigNames, {
    onSuccess(data) {
      setSelectedConfig(data[0]);
    },
  });
  // Mutations
  const setConfig = useMutation(
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

  const createConfigMut = useMutation(
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
        <ProgressSpinner
          style={{ width: "25px", height: "25px" }}
          strokeWidth="8"
          animationDuration=".5s"
        />
      );
    }

    if (!configNames.data) {
      return <div>Unable to fetch config names</div>;
    }

    return (
      <Dropdown
        value={selectedConfig}
        onChange={(e) => setSelectedConfig(e.value)}
        options={configNames.data.map((it) => ({
          label: it,
          value: it,
        }))}
        placeholder="Select config name"
        className="w-40"
      />
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
    <div className="p-2 bg-slate-100">
      <Toast ref={toast} />
      <header className="flex mb-2 justify-between">
        <ConfigSelect />

        <div className="flex gap-1">
          <InputText
            placeholder="Config name"
            onChange={(e) => setCreateConfigName(e.target.value)}
            value={createConfigName}
          />
          <Button
            loading={createConfigMut.isLoading}
            onClick={() => createConfigMut.mutate(createConfigName)}
          >
            Create config
          </Button>
        </div>

        <Button
          loading={setConfig.isLoading}
          onClick={() => setConfig.mutate()}
        >
          Update config
        </Button>
      </header>
      <div className="border">
        <Editor
          height="90vh"
          defaultLanguage="json"
          value={value}
          defaultValue={value}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};
