export const Token = {
  token: "",
  get() {
    return this.token;
  },
  set(token: string) {
    this.token = token;
  },
};
