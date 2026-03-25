import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendResetPasswordEmail } from "@/lib/email";
export const runtime = "nodejs";
export async function createAndSendPasswordReset(args: {
  email: string;
  name?: string | null;
}) {
  const email = args.email.trim().toLowerCase();

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.passwordResetToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const base = process.env.APP_URL!;
  const resetUrl = `${base}/app/reset-password?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`;

  await sendResetPasswordEmail({
    to: email,
    name: args.name ?? null,
    resetUrl,
  });
}
