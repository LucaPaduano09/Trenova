"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

type Phase = "intro" | "exit" | "revealed";

export default function LandingRevealShell({
  children,
}: {
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setPhase("exit");
    }, 1000);

    const revealTimer = window.setTimeout(() => {
      setPhase("revealed");
    }, 1725);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  return (
    <>
      <div
        className={[
          "transition-[opacity,transform,filter] duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)]",
          phase === "exit"
            ? "opacity-100 translate-y-0 blur-0"
            : "opacity-100 translate-y-0 blur-0",
        ].join(" ")}
      >
        {children}
      </div>

      {phase !== "revealed" ? (
        <div
          className={[
            "pointer-events-none fixed inset-0 z-[120] overflow-hidden bg-[#060b16]",
            "transition-[opacity,transform,clip-path] duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)]",
            phase === "exit"
              ? "opacity-0 scale-[1.04] [clip-path:inset(0_0_100%_0_round_0px)]"
              : "opacity-100 scale-100 [clip-path:inset(0_0_0%_0_round_0px)]",
          ].join(" ")}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(52,211,153,0.18),transparent_20%),radial-gradient(circle_at_50%_55%,rgba(59,130,246,0.18),transparent_26%),linear-gradient(180deg,#060b16_0%,#09101e_100%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:42px_42px]" />

          <div className="relative flex h-full items-center justify-center">
            <div className="landing-reveal-mark relative flex items-center justify-center">
              <div className="absolute inset-[-34px] rounded-full bg-emerald-400/12 blur-3xl" />
              <div className="absolute inset-[-56px] rounded-full bg-cyan-400/10 blur-[90px]" />
              <Image
                src="/icons/logo-final2.png"
                alt="Trenova"
                width={124}
                height={124}
                priority
                className="relative h-24 w-24 object-contain drop-shadow-[0_0_28px_rgba(255,255,255,0.18)] sm:h-28 sm:w-28"
              />
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .landing-reveal-mark {
          animation: landingTrill 1000ms cubic-bezier(.22,1,.36,1) both;
          transform-origin: 50% 50%;
          will-change: transform, filter, opacity;
        }

        @keyframes landingTrill {
          0% {
            opacity: 0;
            transform: scale(0.82) rotate(0deg);
            filter: blur(10px);
          }
          18% {
            opacity: 1;
            transform: scale(1.02) rotate(-7deg);
            filter: blur(0);
          }
          34% {
            transform: scale(1) rotate(6deg);
          }
          50% {
            transform: scale(1.03) rotate(-5deg);
          }
          66% {
            transform: scale(1) rotate(3deg);
          }
          82% {
            transform: scale(1.01) rotate(-2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
            filter: blur(0);
          }
        }
      `}</style>
    </>
  );
}
