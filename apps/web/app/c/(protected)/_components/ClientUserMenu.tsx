"use client";

import Link from "next/link";
import { logout } from "@/actions/logout";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  fullName: string;
  email?: string | null;
  hasTenant: boolean;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

export default function ClientUserMenu({
  fullName,
  email,
  hasTenant,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const initials = getInitials(fullName);

  useEffect(() => {
    setMounted(true);
  }, []);

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 290;
    const viewportPadding = 16;

    let left = rect.right - menuWidth;
    if (left < viewportPadding) left = viewportPadding;

    const maxLeft = window.innerWidth - menuWidth - viewportPadding;
    if (left > maxLeft) left = maxLeft;

    setPosition({
      top: rect.bottom + 12,
      left,
      width: menuWidth,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;

      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;

      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    function onReposition() {
      updatePosition();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left transition hover:bg-white/[0.07]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-white">
          {initials}
        </div>

        <div className="hidden min-w-0 sm:block">
          <div className="max-w-[160px] truncate text-sm font-medium text-white">
            {fullName}
          </div>
          <div className="text-xs text-white/45">
            {hasTenant ? "Cliente collegato" : "Cliente standalone"}
          </div>
        </div>

        <svg
          className={[
            "h-4 w-4 shrink-0 text-white/45 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {mounted && open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: 9999,
              }}
              className="overflow-hidden rounded-[26px] border border-white/10 bg-black/85 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
              <div className="border-b border-white/8 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-semibold text-white">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">
                      {fullName}
                    </div>
                    <div className="truncate text-xs text-white/45">
                      {email || "Nessuna email"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
                  {hasTenant
                    ? "Collegato a un trainer"
                    : "Nessun trainer collegato"}
                </div>
              </div>

              <div className="p-2">
                <Link
                  href="/c/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <span>Profilo</span>
                  <span className="text-white/30">→</span>
                </Link>

                <Link
                  href="/c"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <span>Dashboard</span>
                  <span className="text-white/30">→</span>
                </Link>

                <div className="my-2 h-px bg-white/8" />

                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm text-red-200 transition hover:bg-red-500/10"
                  >
                    <span>Logout</span>
                    <span className="text-red-200/50">↗</span>
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}