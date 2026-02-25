"use client";

import AuthCard from "../../_components/AuthCard";

export default function SignInPage() {
  return (
    <div className="max-w-xl flex items-center justify-center">
      <AuthCard variant="pt" defaultCallbackUrl="/app" />
    </div>
  );
}
