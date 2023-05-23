import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Toast } from "solid-bootstrap";
import { Component, Match, Show, Switch } from "solid-js";
import { ConfigEditor } from "./Editor";
import { Login } from "./Login";
import { TokenStore } from "./api/token";
import { ToastService } from "./services/toast-service";

const client = new QueryClient();

export const App: Component = () => {
  if (!TokenStore.get()) {
    return;
  }

  return (
    <Switch>
      <Match when={!TokenStore.get()}>
        <Login onLogin={(it) => TokenStore.set(it)} />;
      </Match>
      <Match when={TokenStore.get()}>
        <QueryClientProvider client={client}>
          <div class="relative">
            <div class="absolute top-10 right-5 z-50">
              <Toast
                show={ToastService.state().show}
                bg={ToastService.state().severity}
              >
                <Toast.Header>{ToastService.state().header}</Toast.Header>
                <Show when={ToastService.state().body}>
                  <Toast.Body>{ToastService.state().body}</Toast.Body>
                </Show>
              </Toast>
            </div>
            <ConfigEditor onLogout={() => TokenStore.clear()} />
          </div>
        </QueryClientProvider>
      </Match>
    </Switch>
  );
};
