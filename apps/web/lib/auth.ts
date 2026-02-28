// lib/auth.ts
import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
/**
 * Utils
 */
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
  adapter: PrismaAdapter(prisma),
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
          //   // poi in UI intercetti res.error === "EMAIL_NOT_VERIFIED"
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName ?? undefined,
          tenantId: user.tenantId ?? null,
          role: user.role,
        } as any;
      },
    }),
  ],

  /**
   * Primo onboarding: crea tenant e collega l'utente.
   * NB: con magic link non hai "variant" → quindi per ora:
   * - se non ha tenantId, lo trattiamo come OWNER e creiamo tenant
   */
  events: {
    async createUser({ user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, fullName: true, tenantId: true },
      });

      if (!dbUser) return;
      if (dbUser.tenantId) return;

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
      if (user?.id) token.sub = user.id;
      return token;
    },

    async session({ session, token }) {
      const userId = token.sub as string | undefined;
      if (!userId) return session;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, tenantId: true, role: true, email: true },
      });

      return {
        ...session,
        user: {
          ...session.user,
          id: userId,
          email: dbUser?.email ?? session.user?.email ?? "",
          tenantId: dbUser?.tenantId ?? "",
          role: (dbUser?.role as "OWNER" | "CLIENT") ?? "OWNER",
        },
      };
    },
  },

  pages: {
    signIn: "/app/sign-in",
    verifyRequest: "/app/verify",
  },
});
