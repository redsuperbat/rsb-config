export const TokenStore = {
  get() {
    const token = localStorage.getItem("token");
    return token ?? "";
  },
  set(token: string) {
    localStorage.setItem("token", token);
  },
};
