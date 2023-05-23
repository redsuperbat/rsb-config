import { TokenStore } from "./token";

type ErrorMsg = {
  message: string;
  code: number;
};

class NetworkError extends Error {
  constructor(public code: number, public message: string) {
    super(message);
  }
}

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
      Authorization: `Bearer ${TokenStore.get()}`,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json()) as T;
  if (!res.ok) {
    let message = "Unknown error occurred!";
    if (isErrorMsg(data)) {
      throw new NetworkError(data.code, data.message);
    }
    throw new NetworkError(res.status, message);
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

// This does not make the assumption that it's json
export const getConfigByName = async (configName: string) => {
  const res = await fetch(`/api/config/${configName}`, {
    headers: {
      Authorization: `Bearer ${TokenStore.get()}`,
    },
  });
  if (!res.ok) {
    throw new Error("Bad request");
  }
  return res.text();
};

export const setConfigByName = (configName: string, config: string) =>
  Fetch.put(`/api/config/${configName}`, config);

export const createConfig = (configName: string) =>
  Fetch.post(`/api/config/${configName}`);

export const loginApi = (username: string, password: string) =>
  Fetch.post<{ token: string }>("/auth/login", {
    username,
    password,
  });

export const generateApiKey = () =>
  Fetch.post<{ apiKey: string }>("/api/generate-api-key");
