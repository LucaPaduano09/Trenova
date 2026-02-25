"use client";

export default function CinematicKinetiqLoop({
  className = "",
  height = 420,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-3xl",
        "bg-black/40 border border-white/10",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_25px_80px_rgba(0,0,0,0.6)]",
        className,
      ].join(" ")}
      style={{ height }}
    >
      <div className="absolute inset-0 kinetiq-bg" />
      <div className="absolute inset-0 kinetiq-sweep opacity-70" />
      <div className="absolute inset-0 kinetiq-particles opacity-60" />
      <div className="absolute inset-0 kinetiq-grid opacity-40" />
      <div className="absolute inset-0 kinetiq-scanlines opacity-30 kinetiq-scanlinesOpt" />
      <div className="absolute inset-0 kinetiq-vignette" />

      <div className="absolute inset-0 flex items-end justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-5xl">
          <div className="absolute -inset-3 rounded-3xl kinetiq-chart-glow" />

          <svg
            viewBox="0 0 1200 420"
            className="relative w-full rounded-3xl bg-white/[0.03] border border-white/10"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(52,211,153,0.95)" />
                <stop offset="45%" stopColor="rgba(34,211,238,0.95)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0.95)" />
              </linearGradient>

              <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34,211,238,0.22)" />
                <stop offset="55%" stopColor="rgba(52,211,153,0.10)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>

              <filter
                id="softGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="
                    1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 18 -7"
                  result="glow"
                />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>

              <mask id="shineMask">
                <rect
                  x="-400"
                  y="0"
                  width="400"
                  height="420"
                  fill="url(#shine)"
                  className="kinetiq-shine"
                />
              </mask>

              <clipPath id="revealClip">
                <rect
                  x="0"
                  y="0"
                  width="0"
                  height="420"
                  className="kinetiq-reveal"
                />
              </clipPath>
            </defs>

            {/* dots (desktop). on mobile we hide via CSS */}
            <g opacity="0.22" className="kinetiq-dots">
              {Array.from({ length: 18 }).map((_, r) =>
                Array.from({ length: 28 }).map((__, c) => (
                  <circle
                    key={`${r}-${c}`}
                    cx={70 + c * 40}
                    cy={50 + r * 20}
                    r="1.3"
                    fill="rgba(255,255,255,0.35)"
                  />
                ))
              )}
            </g>

            <path
              d="M60 360 H1140"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="2"
            />

            <g clipPath="url(#revealClip)">
              <path
                d="M60 340
                   C140 300, 210 290, 280 310
                   C350 330, 420 250, 490 235
                   C560 220, 640 240, 710 210
                   C780 180, 840 205, 910 150
                   C980 95, 1050 130, 1140 80
                   L1140 360 L60 360 Z"
                fill="url(#fillGrad)"
                className="kinetiq-fill"
              />

              <path
                d="M60 340
                   C140 300, 210 290, 280 310
                   C350 330, 420 250, 490 235
                   C560 220, 640 240, 710 210
                   C780 180, 840 205, 910 150
                   C980 95, 1050 130, 1140 80"
                stroke="url(#lineGrad)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#softGlow)"
                className="kinetiq-line"
              />

              <g
                mask="url(#shineMask)"
                opacity="0.75"
                className="kinetiq-shineWrap"
              >
                <path
                  d="M60 340
                     C140 300, 210 290, 280 310
                     C350 330, 420 250, 490 235
                     C560 220, 640 240, 710 210
                     C780 180, 840 205, 910 150
                     C980 95, 1050 130, 1140 80"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>

            {/* points fade in */}
            <g className="kinetiq-points">
              {[
                [60, 340],
                [280, 310],
                [490, 235],
                [710, 210],
                [910, 150],
                [1140, 80],
              ].map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="10" fill="rgba(34,211,238,0.18)" />
                  <circle cx={x} cy={y} r="5" fill="rgba(255,255,255,0.85)" />
                </g>
              ))}
            </g>

            {/* live dot (we keep it, but can disable on mobile via CSS) */}
            <g className="kinetiq-live">
              <circle
                r="26"
                fill="rgba(34,211,238,0.10)"
                filter="url(#softGlow)"
              >
                <animateMotion
                  dur="3.2s"
                  repeatCount="indefinite"
                  keyTimes="0;1"
                  keySplines=".42,0,.58,1"
                  calcMode="spline"
                  path="M60 340
                        C140 300, 210 290, 280 310
                        C350 330, 420 250, 490 235
                        C560 220, 640 240, 710 210
                        C780 180, 840 205, 910 150
                        C980 95, 1050 130, 1140 80"
                />
              </circle>

              <circle r="7" fill="rgba(255,255,255,0.90)">
                <animateMotion
                  dur="3.2s"
                  repeatCount="indefinite"
                  keyTimes="0;1"
                  keySplines=".42,0,.58,1"
                  calcMode="spline"
                  path="M60 340
                        C140 300, 210 290, 280 310
                        C350 330, 420 250, 490 235
                        C560 220, 640 240, 710 210
                        C780 180, 840 205, 910 150
                        C980 95, 1050 130, 1140 80"
                />
              </circle>
            </g>

            <circle
              cx="260"
              cy="120"
              r="80"
              fill="rgba(52,211,153,0.10)"
              className="kinetiq-orb1"
            />
            <circle
              cx="980"
              cy="240"
              r="110"
              fill="rgba(59,130,246,0.10)"
              className="kinetiq-orb2"
            />
          </svg>

          {/* caption */}
          <div className="pointer-events-none absolute left-4 sm:left-6 top-4 sm:top-5 flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
            <div className="text-xs sm:text-sm text-white/80">
              Progressi in tempo reale • by Kinetiq.io
            </div>
          </div>

          {/* KPI badge (hide on very small screens) */}
          <div className="pointer-events-none absolute right-4 sm:right-6 top-4 sm:top-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-3 kinetiq-kpi hidden sm:block">
            <div className="text-xs text-white/50">Questa settimana</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-lg font-semibold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                +12%
              </div>
              <div className="text-sm text-white/70">progressi</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* --- base visuals (same as before) --- */
        .kinetiq-bg {
          background: radial-gradient(
              900px 420px at 30% 40%,
              rgba(52, 211, 153, 0.12),
              transparent 60%
            ),
            radial-gradient(
              800px 460px at 70% 45%,
              rgba(59, 130, 246, 0.12),
              transparent 62%
            ),
            radial-gradient(
              700px 420px at 50% 60%,
              rgba(34, 211, 238, 0.1),
              transparent 65%
            ),
            linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0));
          filter: saturate(1.1);
        }

        .kinetiq-grid {
          background-image: linear-gradient(
              rgba(255, 255, 255, 0.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.08) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
          mask-image: radial-gradient(
            closest-side at 50% 50%,
            rgba(0, 0, 0, 1),
            rgba(0, 0, 0, 0)
          );
        }

        .kinetiq-scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.05) 1px,
            transparent 1px,
            transparent 6px
          );
          mix-blend-mode: overlay;
        }

        .kinetiq-vignette {
          background: radial-gradient(
            closest-side at 50% 40%,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.25) 55%,
            rgba(0, 0, 0, 0.65) 100%
          );
          pointer-events: none;
        }

        .kinetiq-sweep {
          background: radial-gradient(
            400px 220px at 0% 50%,
            rgba(34, 211, 238, 0),
            rgba(34, 211, 238, 0.18),
            rgba(34, 211, 238, 0)
          );
          transform: translateX(-40%);
          animation: sweep 6.5s ease-in-out infinite;
          mix-blend-mode: screen;
          filter: blur(0.5px);
        }
        @keyframes sweep {
          0% {
            transform: translateX(-45%);
            opacity: 0;
          }
          15% {
            opacity: 0.65;
          }
          50% {
            transform: translateX(45%);
            opacity: 0.75;
          }
          85% {
            opacity: 0.55;
          }
          100% {
            transform: translateX(55%);
            opacity: 0;
          }
        }

        .kinetiq-particles {
          background-image: radial-gradient(
              circle at 18% 40%,
              rgba(52, 211, 153, 0.35) 0 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 48% 25%,
              rgba(34, 211, 238, 0.35) 0 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 76% 55%,
              rgba(59, 130, 246, 0.35) 0 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 62% 70%,
              rgba(52, 211, 153, 0.25) 0 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 30% 75%,
              rgba(34, 211, 238, 0.25) 0 1px,
              transparent 2px
            );
          animation: floaty 7s ease-in-out infinite;
          filter: blur(0.2px);
          mix-blend-mode: screen;
        }
        @keyframes floaty {
          0%,
          100% {
            transform: translateY(0px);
            opacity: 0.55;
          }
          50% {
            transform: translateY(-10px);
            opacity: 0.75;
          }
        }

        .kinetiq-chart-glow {
          background: radial-gradient(
              420px 240px at 25% 30%,
              rgba(52, 211, 153, 0.18),
              transparent 60%
            ),
            radial-gradient(
              520px 300px at 80% 55%,
              rgba(59, 130, 246, 0.18),
              transparent 62%
            );
          filter: blur(14px);
          opacity: 0.75;
        }

        /* reveal */
        .kinetiq-reveal {
          animation: reveal 3.2s ease-in-out infinite;
        }
        @keyframes reveal {
          0% {
            width: 0;
          }
          12% {
            width: 0;
          }
          70% {
            width: 1200px;
          }
          100% {
            width: 1200px;
          }
        }

        .kinetiq-fill {
          opacity: 0;
          animation: fillIn 1.2s ease forwards 1s;
        }
        @keyframes fillIn {
          to {
            opacity: 1;
          }
        }

        .kinetiq-line {
          opacity: 0.98;
          animation: linePulse 2.8s ease-in-out infinite 1.6s;
        }
        @keyframes linePulse {
          0%,
          100% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
        }

        .kinetiq-shine {
          animation: shineMove 3.8s ease-in-out infinite 1.6s;
        }
        @keyframes shineMove {
          0% {
            transform: translateX(-420px);
          }
          55% {
            transform: translateX(1400px);
          }
          100% {
            transform: translateX(1400px);
          }
        }

        .kinetiq-points {
          opacity: 0;
          animation: pointsIn 3.2s ease-in-out infinite;
        }
        @keyframes pointsIn {
          0%,
          30% {
            opacity: 0;
          }
          55%,
          100% {
            opacity: 1;
          }
        }

        .kinetiq-orb1 {
          animation: orb1 6.8s ease-in-out infinite;
        }
        .kinetiq-orb2 {
          animation: orb2 7.6s ease-in-out infinite;
        }
        @keyframes orb1 {
          0%,
          100% {
            transform: translate(0, 0);
            opacity: 0.55;
          }
          50% {
            transform: translate(18px, 10px);
            opacity: 0.8;
          }
        }
        @keyframes orb2 {
          0%,
          100% {
            transform: translate(0, 0);
            opacity: 0.5;
          }
          50% {
            transform: translate(-22px, -14px);
            opacity: 0.78;
          }
        }

        .kinetiq-kpi {
          animation: kpiFloat 4.8s ease-in-out infinite;
        }
        @keyframes kpiFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        /* ✅ Mobile optimizations */
        @media (max-width: 640px) {
          /* kill the heaviest overlay */
          .kinetiq-scanlinesOpt {
            display: none;
          }

          /* reduce background complexity slightly */
          .kinetiq-grid {
            opacity: 0.25;
          }

          /* hide dots (many DOM nodes) */
          :global(.kinetiq-dots) {
            display: none;
          }

          /* soften glow cost */
          :global(svg) {
            filter: none;
          }
          .kinetiq-chart-glow {
            opacity: 0.55;
            filter: blur(12px);
          }

          /* optional: reduce live dot complexity */
          :global(.kinetiq-live) {
            opacity: 0.8;
          }
        }

        /* ✅ Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .kinetiq-sweep,
          .kinetiq-particles,
          .kinetiq-reveal,
          .kinetiq-fill,
          .kinetiq-line,
          .kinetiq-shine,
          .kinetiq-points,
          .kinetiq-orb1,
          .kinetiq-orb2,
          .kinetiq-kpi {
            animation: none !important;
          }
          :global(.kinetiq-live) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
