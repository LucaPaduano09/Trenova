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
