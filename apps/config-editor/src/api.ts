import { Token } from "./token";

type ErrorMsg = {
  message: string;
  code: number;
};

const isErrorMsg = (data: unknown): data is ErrorMsg =>
  typeof data === "object" && data !== null && "message" in data;

const baseFetch = async <T = unknown>(
  url: string,
  method?: string,
  body?: unknown
) => {
  const res = await fetch(url, {
    body:
      typeof body === "string" || typeof body === "undefined"
        ? body
        : JSON.stringify(body),
    method,
    headers: {
      Authorization: `Bearer ${Token.get()}`,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json()) as T;

  if (!res.ok) {
    let message = "Unknown error occurred!";
    if (isErrorMsg(data)) {
      message = data.message;
    }
    throw new Error(message);
  }

  return data;
};

const Fetch = {
  async get<T = unknown>(url: string) {
    return baseFetch<T>(url);
  },
  async post<T = unknown>(url: string, body?: unknown) {
    return baseFetch<T>(url, "POST", body);
  },
  async put<T = unknown>(url: string, body?: unknown) {
    return baseFetch<T>(url, "PUT", body);
  },
} as const;

export const getConfigNames = () => Fetch.get<string[]>("/api/configNames");

export const getConfigByName = (configName: string) =>
  Fetch.get<string>(`/api/config/${configName}`);

export const setConfigByName = (configName: string, config: string) =>
  Fetch.put(`/api/config/${configName}`, config);

export const createConfig = (configName: string) =>
  Fetch.post(`/api/config/${configName}`);

export const login = (username: string, password: string) =>
  Fetch.post<{ token: string }>("/auth/login", {
    username,
    password,
  });
