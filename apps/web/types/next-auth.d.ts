import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string | null;
      role: "OWNER" | "CLIENT";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    tenantId?: string | null;
    role: "OWNER" | "CLIENT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    email?: string | null;
    name?: string | null;
    tenantId?: string | null;
    role?: "OWNER" | "CLIENT";
  }
}