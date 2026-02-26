"use client";

import { Suspense } from "react";
import AuthCard from "../../_components/AuthCard";

export default function SignInPage() {
  return (
    <div className="max-w-xl flex items-center justify-center">
      <Suspense fallback={null}>
        <AuthCard variant="pt" defaultCallbackUrl="/app" />
      </Suspense>
    </div>
  );
}
