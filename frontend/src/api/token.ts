import { createEffect, createSignal } from "solid-js";
const key = "token";

const [token, setToken] = createSignal(localStorage.getItem(key));

createEffect(() => {
  localStorage.setItem(key, token());
});

export const TokenStore = {
  get: token,
  set(token: string) {
    setToken(token);
  },
  hasToken: () => !!token(),
  clear() {
    setToken("");
  },
};
