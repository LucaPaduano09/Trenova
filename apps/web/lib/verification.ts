// apps/web/lib/verification.ts
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendVerifyEmail } from "@/lib/email";

export async function createAndSendEmailVerification(args: {
  email: string;
  name?: string | null;
}) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  // opzionale: elimina token precedenti per stessa email
  await prisma.verificationToken.deleteMany({
    where: { identifier: args.email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: args.email,
      token,
      expires,
    },
  });

  const base = process.env.APP_URL!;
  const verifyUrl = `${base}/app/verify-email?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(args.email)}`;

  await sendVerifyEmail({
    to: args.email,
    name: args.name,
    verifyUrl,
  });
}
