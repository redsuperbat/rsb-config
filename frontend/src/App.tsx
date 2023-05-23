import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Component, createSignal } from "solid-js";
import { ConfigEditor } from "./Editor";
import { Login } from "./Login";
import { TokenStore } from "./api/token";

const client = new QueryClient();

export const App: Component = () => {
  const [token, setToken] = createSignal(TokenStore.get());

  if (!token) {
    return <Login onLogin={(it) => setToken(it)} />;
  }

  return (
    <QueryClientProvider client={client}>
      <ConfigEditor
        onLogout={() => {
          TokenStore.clear();
          setToken(TokenStore.get());
        }}
      />
    </QueryClientProvider>
  );
};
