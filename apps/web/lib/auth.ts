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
  session: { strategy: "database" },

  providers: [
    Nodemailer({
      from: process.env.EMAIL_FROM,
      server: process.env.EMAIL_SERVER, // smtp://resend:APIKEY@smtp.resend.com:587
    }),
    Credentials({
      name: "Email e Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email || "")
          .toString()
          .trim()
          .toLowerCase();
        const password = (credentials?.password || "").toString();

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
          },
        });

        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // ritorna un oggetto user compatibile
        return {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
          name: user.fullName ?? undefined,
        } as any;
      },
    }),
  ],

  /**
   * On first user creation: create a Tenant and attach it to the user.
   * This removes the "missing tenantId in session" issue.
   */
  events: {
    async createUser({ user }) {
      // Read the user from DB (adapter created it)
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, fullName: true, tenantId: true },
      });

      if (!dbUser) return;
      if (dbUser.tenantId) return; // already linked

      const email = dbUser.email;
      const baseName = (email?.split("@")[0] || "coach").slice(0, 40);
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
    /**
     * Always hydrate session with tenantId + role from DB (robust across adapters).
     */
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, tenantId: true, role: true },
      });

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
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
