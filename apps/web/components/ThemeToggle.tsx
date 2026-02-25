"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 2v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 20v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4.93 4.93l1.41 1.41"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17.66 17.66l1.41 1.41"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M2 12h2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M20 12h2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4.93 19.07l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M21 14.5A7.5 7.5 0 0 1 9.5 3a6.8 6.8 0 1 0 11.5 11.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // evita mismatch

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={[
        "group relative inline-flex items-center gap-2",
        "rounded-2xl border px-3 py-2 text-sm",
        "bg-white/60 dark:bg-white/5",
        "backdrop-blur-xl shadow-sm",
        "cf-text dark:text-neutral-100",
        "border-neutral-200/70 dark:border-white/10",
        "hover:bg-white/80 dark:hover:bg-white/10",
        "transition-all active:scale-[0.98]",
      ].join(" ")}
      aria-label="Toggle theme"
      title={isDark ? "Passa a chiaro" : "Passa a scuro"}
    >
      <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.10),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.10),transparent_55%)]" />
      <span className="relative grid h-5 w-5 place-items-center cf-text dark:text-neutral-200">
        {isDark ? (
          <MoonIcon className="h-5 w-5" />
        ) : (
          <SunIcon className="h-5 w-5" />
        )}
      </span>
      <span className="relative hidden sm:block">
        {isDark ? "Scuro" : "Chiaro"}
      </span>
    </button>
  );
}
