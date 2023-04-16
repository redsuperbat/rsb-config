import React from "react";
import { ConfigEditor } from "./ConfigEditor";
import { Login } from "./Login";
import { TokenStore } from "./token";

export const App: React.FC = () => {
  const [token, setToken] = React.useState(TokenStore.get());

  if (!token) {
    return <Login onLogin={(it) => setToken(it)} />;
  }

  return (
    <ConfigEditor
      onLogout={() => {
        TokenStore.clear();
        setToken(TokenStore.get());
      }}
    />
  );
};
