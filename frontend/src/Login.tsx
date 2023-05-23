import { Button, Form } from "solid-bootstrap";
import { createSignal } from "solid-js";
import { loginApi } from "./api/http-client";
import { TokenStore } from "./api/token";

export const Login = (props: { onLogin: (token: string) => void }) => {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");

  const onSubmit = async () => {
    const res = await loginApi(username(), password());
    TokenStore.set(res.token);
    props.onLogin(res.token);
  };

  return (
    <div class="grid place-items-center h-full">
      <div class="flex flex-col p-4 shadow-md bg-white rounded space-y-2">
        <h1 class="font-bold text-lg">Login</h1>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <Form.Group class="mb-3" controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="username"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Group>

          <Form.Group class="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </div>
    </div>
  );
};
