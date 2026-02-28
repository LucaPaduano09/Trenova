// apps/web/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerifyEmail(opts: {
  to: string;
  name?: string | null;
  verifyUrl: string;
}) {
  const from = process.env.EMAIL_FROM!;
  const subject = "Conferma la tua email";

  const html = `
  <div style="font-family: ui-sans-serif, system-ui; line-height:1.5">
    <h2 style="margin:0 0 12px">Conferma la tua email</h2>
    <p style="margin:0 0 16px">
      Clicca il bottone per confermare il tuo account Kinetiq.
    </p>
    <p style="margin:0 0 24px">
      <a href="${opts.verifyUrl}"
         style="display:inline-block;padding:12px 16px;border-radius:12px;
                background:#111;color:#fff;text-decoration:none;font-weight:600">
        Conferma email
      </a>
    </p>
    <p style="margin:0;color:#666;font-size:12px">
      Se non hai richiesto tu questa email, ignora pure.
    </p>
  </div>`;

  await resend.emails.send({
    from,
    to: opts.to,
    subject,
    html,
  });
}
export async function sendResetPasswordEmail(args: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  const { to, name, resetUrl } = args;

  const html = `
  <div style="font-family: Inter, sans-serif; padding: 24px;">
    <h2>Reimposta la password</h2>
    <p>Ciao ${name ?? ""},</p>
    <p>Abbiamo ricevuto una richiesta di reset password.</p>
    <a href="${resetUrl}"
       style="display:inline-block;padding:12px 20px;background:#0ea5e9;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
       Reimposta password
    </a>
    <p style="margin-top:16px;font-size:14px;color:#666;">
      Se non sei stato tu, ignora questa email. Il link scade tra 30 minuti.
    </p>
  </div>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Reimposta la password — Trenova",
    html,
  });
}
