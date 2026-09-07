import { createMiddleware } from "@tanstack/react-start";

export const attachNeonAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("ch_auth_token") : null;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
);
