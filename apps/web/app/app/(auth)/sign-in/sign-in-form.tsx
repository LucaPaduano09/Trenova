"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        await signIn("nodemailer", {
          email,
          callbackUrl: "/app",
        });
        setLoading(false);
      }}
      className="space-y-3"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
      />
      <button
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send magic link"}
      </button>
    </form>
  );
}
