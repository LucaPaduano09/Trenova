// app/app/(auth)/layout.tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-black text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-[-120px] h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-32 right-[-180px] h-[560px] w-[560px] rounded-full bg-yellow-400/15 blur-3xl" />
        <div className="absolute bottom-[-240px] left-1/3 h-[520px] w-[520px] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>
      {children}
    </div>
  );
}
