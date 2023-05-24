import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Toast } from "solid-bootstrap";
import { Component, For, Match, Show, Switch } from "solid-js";
import { ConfigEditor } from "./Editor";
import { Login } from "./Login";
import { Toolbar } from "./Toolbar";
import { ToastService } from "./services/toast-service";
import { TokenStore } from "./stores/token-store";

const client = new QueryClient();

export const App: Component = () => {
  return (
    <Switch>
      <Match when={!TokenStore.get()}>
        <Login onLogin={(it) => TokenStore.set(it)} />;
      </Match>
      <Match when={TokenStore.get()}>
        <QueryClientProvider client={client}>
          <div class="relative h-full">
            <div class="absolute top-10 right-5 z-50 flex flex-col gap-1">
              <For each={ToastService.state()}>
                {(it) => (
                  <Toast show={true} bg={it.severity}>
                    <Toast.Header>{it.header}</Toast.Header>
                    <Show when={it.body}>
                      <Toast.Body>{it.body}</Toast.Body>
                    </Show>
                  </Toast>
                )}
              </For>
            </div>
            <Toolbar onLogout={() => TokenStore.clear()} />
            <ConfigEditor />
          </div>
        </QueryClientProvider>
      </Match>
    </Switch>
  );
};
