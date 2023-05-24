import { editor } from "monaco-editor";
import { Component, createEffect, createSignal, onMount } from "solid-js";
import { useConfigService } from "./services/config-service";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};

export const ConfigEditor: Component = () => {
  const { updateConfig, editingConfig } = useConfigService();
  const [instance, setInstance] = createSignal<editor.ICodeEditor>();

  const handleEditorDidMount = (editor: editor.ICodeEditor) => {
    setInstance(editor);
    editor.onKeyDown((e) => {
      if (!e.metaKey) return;
      if (e.keyCode !== 49) return;
      e.preventDefault();
      updateConfig.mutateAsync(editor.getValue());
    });
  };

  createEffect((prev) => {
    const curr = editingConfig();
    const editor = instance();
    if (!editor) return;
    if (prev === curr) return;
    if (!curr) return;
    editor.setValue(curr);
    return curr;
  });

  onMount(() => {
    editor.onDidCreateEditor(handleEditorDidMount);
    editor.create(document.getElementById("editor-container"), {
      automaticLayout: true,
      language: "json",
    });
  });

  return (
    <div class="p-2 bg-slate-100 h-full">
      <div id="editor-container" class="h-full"></div>
    </div>
  );
};
