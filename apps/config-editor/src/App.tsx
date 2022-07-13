import Editor from "@monaco-editor/react";
import { Button, Input, notification, Select, Spin } from "antd";
import { editor } from "monaco-editor";
import React, { useRef, useState } from "react";
import { useMutation, useQuery } from "react-query";
import {
  createConfig,
  getConfigByName,
  getConfigNames,
  setConfigByName,
} from "./api";
const { Option } = Select;

export const App: React.FC = () => {
  const editorRef = useRef<editor.ICodeEditor>();
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

  const onConfigSelected = (value: string) => {
    setSelectedConfig(value);
  };

  const configNames = useQuery("config-names", getConfigNames, {
    onSuccess(data) {
      onConfigSelected(data[0]);
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
        notification.success({
          message: `Config ${selectedConfig} updated!`,
          maxCount: 3,
          duration: 3,
        });
      },
      onError(error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        notification.error({
          message: `Unable to update config because of: [${message}]`,
          duration: 3,
        });
      },
    }
  );

  const createConfigMut = useMutation(
    (configName: string) => createConfig(configName),
    {
      onSuccess(_, name) {
        configNames.refetch();
        notification.success({
          message: `Successfully created config ${name}!`,
          duration: 3,
        });
        setCreateConfigName("");
      },
      onError(error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        notification.error({
          message,
          duration: 3,
        });
      },
    }
  );

  const ConfigSelect = () => {
    if (configNames.isLoading) {
      return <Spin />;
    }

    if (!configNames.data) {
      return <div>Unable to fetch config names</div>;
    }

    return (
      <Select
        placeholder="Select config name"
        className="w-40"
        onSelect={onConfigSelected}
        value={selectedConfig}
      >
        {configNames.data.map((name) => (
          // @ts-ignore
          <Option key={name} value={name}>
            {name}
          </Option>
        ))}
      </Select>
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
      <header className="flex mb-2 justify-between">
        <ConfigSelect />

        <div className="flex">
          {/* @ts-ignore */}
          <Input
            placeholder="Config name"
            onChange={(e: any) => setCreateConfigName(e?.target?.value)}
            value={createConfigName}
          />
          {/* @ts-ignore */}
          <Button
            className="bg-white"
            onClick={() => createConfigMut.mutate(createConfigName)}
          >
            Create config
          </Button>
        </div>

        {/* @ts-ignore */}
        <Button
          className="bg-white"
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
          defaultValue={value}
          value={value}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};
