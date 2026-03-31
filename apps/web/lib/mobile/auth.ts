import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

type MobileClientTokenPayload = {
  sub: string;
  role: "CLIENT";
  tenantId: string | null;
  email: string;
  name: string | null;
};

type MobileClientSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "CLIENT";
  tenantId: string | null;
};

type AuthenticatedClient = {
  id: string;
  email: string;
  fullName: string | null;
  role: "CLIENT";
  tenantId: string | null;
};

type MobileClientAuthSession = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "CLIENT";
    tenantId: string | null;
  };
  hasTenant: boolean;
};

const MOBILE_CLIENT_ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function getMobileAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("MOBILE_AUTH_SECRET_MISSING");
  }

  return new TextEncoder().encode(secret);
}

export async function createMobileClientAccessToken(user: {
  id: string;
  email: string;
  fullName: string | null;
  tenantId: string | null;
}) {
  return new SignJWT({
    role: "CLIENT",
    tenantId: user.tenantId ?? null,
    email: user.email,
    name: user.fullName ?? null,
    type: "mobile-client-access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MOBILE_CLIENT_ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(getMobileAuthSecret());
}

export async function verifyMobileClientAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getMobileAuthSecret(), {
    algorithms: ["HS256"],
  });

  if (payload.type !== "mobile-client-access" || payload.role !== "CLIENT") {
    throw new Error("UNAUTHORIZED");
  }

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    (payload.name !== null && payload.name !== undefined && typeof payload.name !== "string")
  ) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    sub: payload.sub,
    role: "CLIENT" as const,
    tenantId: typeof payload.tenantId === "string" ? payload.tenantId : null,
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : null,
  } satisfies MobileClientTokenPayload;
}

export function getBearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

export async function resolveMobileClientSessionUserFromRequest(
  request: Request
): Promise<MobileClientSessionUser | null> {
  const token = getBearerTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const payload = await verifyMobileClientAccessToken(token);

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: "CLIENT",
    tenantId: payload.tenantId,
  };
}

export async function authenticateClientCredentials(input: {
  email: string;
  password: string;
}): Promise<AuthenticatedClient | null> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      tenantId: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!user?.passwordHash || user.role !== "CLIENT") {
    return null;
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword || !user.emailVerified) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: "CLIENT",
    tenantId: user.tenantId ?? null,
  };
}

export async function createMobileClientAuthSessionForUserId(
  userId: string
): Promise<MobileClientAuthSession> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      tenantId: true,
    },
  });

  if (!user || user.role !== "CLIENT") {
    throw new Error("FORBIDDEN");
  }

  const client = await prisma.client.findFirst({
    where: {
      userId: user.id,
      OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
    },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (!client) {
    throw new Error("FORBIDDEN");
  }

  const accessToken = await createMobileClientAccessToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    tenantId: user.tenantId ?? null,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: "CLIENT",
      tenantId: user.tenantId ?? null,
    },
    hasTenant: !!client.tenantId,
  };
}
