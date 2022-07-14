import { Button, Form, Input } from "antd";
import { login } from "./api";
import { Token } from "./token";

export const Login = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const onFinish = async (values: { password: string; username: string }) => {
    const { password, username } = values;
    const res = await login(username, password);
    Token.set(res.token);
    onLogin(res.token);
  };

  return (
    <div className="grid place-items-center h-full">
      <div className="flex flex-col p-4 shadow-md bg-white rounded">
        <h1 className="font-bold text-lg">Login</h1>
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button htmlType="submit">Submit</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
