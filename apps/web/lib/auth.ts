
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function makeUniqueTenantSlug(base: string) {
  const cleanBase = slugify(base) || "coach";
  let slug = cleanBase;

  for (let i = 0; i < 50; i++) {
    const exists = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!exists) return slug;
    slug = `${cleanBase}-${i + 2}`;
  }

  return `${cleanBase}-${Date.now()}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },

  providers: [
    Nodemailer({
      from: process.env.EMAIL_FROM,
      server: process.env.EMAIL_SERVER,
    }),

    Credentials({
      name: "Email e Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            tenantId: true,
            role: true,
            fullName: true,
            emailVerified: true,
          },
        });

        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName ?? undefined,
          tenantId: user.tenantId ?? null,
          role: user.role,
        };
      },
    }),
  ],

  events: {
    async createUser({ user }) {
      if (!user.id) return;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          tenantId: true,
          role: true,
        },
      });

      if (!dbUser) return;

      if (dbUser.tenantId) return;

      if (dbUser.role === "CLIENT") return;

      const email = dbUser.email ?? "";
      const baseName = (email.split("@")[0] || "coach").slice(0, 40);
      const slug = await makeUniqueTenantSlug(baseName);

      const tenant = await prisma.tenant.create({
        data: {
          name: baseName,
          slug,
          email,
        },
        select: { id: true },
      });

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          tenantId: tenant.id,
          role: "OWNER",
          fullName: dbUser.fullName ?? baseName,
        },
      });
    },
  },

  callbacks: {
    async jwt({ token, user }) {

      if (user) {
        token.sub = user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;

        token.role =
          (user as { role?: "OWNER" | "CLIENT" }).role ??
          (token.role as "OWNER" | "CLIENT" | undefined);

        token.tenantId =
          (user as { tenantId?: string | null }).tenantId ??
          (token.tenantId as string | null | undefined) ??
          null;
      }

      if (token.sub && (!token.role || token.tenantId === undefined)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            email: true,
            fullName: true,
            tenantId: true,
            role: true,
          },
        });

        if (dbUser) {
          token.email = dbUser.email;
          token.name = dbUser.fullName ?? token.name;
          token.role = dbUser.role;
          token.tenantId = dbUser.tenantId ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!token.sub) return session;

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          email: (token.email as string | undefined) ?? session.user?.email ?? "",
          name: (token.name as string | undefined) ?? session.user?.name ?? "",
          tenantId: (token.tenantId as string | null | undefined) ?? null,
          role: (token.role as "OWNER" | "CLIENT" | undefined) ?? "OWNER",
        },
      };
    },
  },

  pages: {
    signIn: "/app/sign-in",
    verifyRequest: "/app/verify",
  },
});