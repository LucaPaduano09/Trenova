import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: "OWNER" | "CLIENT";
      email?: string | null;
      name?: string | null;
    };
  }
}
