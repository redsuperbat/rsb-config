import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import { loginApi } from "./api";
import { TokenStore } from "./token";

export const Login = (props: { onLogin: (token: string) => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onFinish = async () => {
    const res = await loginApi(username, password);
    TokenStore.set(res.token);
    props.onLogin(res.token);
  };

  return (
    <div className="grid place-items-center h-full">
      <div className="flex flex-col p-4 shadow-md bg-white rounded space-y-2">
        <h1 className="font-bold text-lg">Login</h1>
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon">
            <i className="pi pi-user"></i>
          </span>
          <InputText
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
        </div>
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon">
            <i className="pi pi-lock"></i>
          </span>
          <InputText
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
        </div>

        <Button onClick={() => onFinish()}>Submit</Button>
      </div>
    </div>
  );
};
