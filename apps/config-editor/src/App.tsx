import React, { useState } from "react";
import { ConfigEditor } from "./ConfigEditor";
import { Login } from "./Login";
import { Token } from "./token";

export const App: React.FC = () => {
  const [token, setToken] = useState(Token.get());

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return <ConfigEditor />;
};
