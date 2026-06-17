import { DefaultSession } from "next-auth";

type Role = "admin" | "cashier";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      username?: string;
      role?: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    username?: string;
    role?: Role;
  }
}
