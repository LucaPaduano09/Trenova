"use client";
import { useEffect, useMemo, useRef, useState } from "react";

function useInViewOnce<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect(); //  ' only once
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px", ...(options || {}) }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return { ref, inView };
}

function Counter({
  target,
  start,
  duration = 1200,
}: {
  target: number;
  start: boolean;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let current = 0;
    const stepMs = 16;
    const increment = target / (duration / stepMs);

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepMs);

    return () => clearInterval(timer);
  }, [start, target, duration]);

  return <span>{count}+</span>;
}

export function PerChiEKinetiq() {
  const cards = useMemo(
    () => [
      {
        title: "Personal Trainer Indipendenti",
        text: "Gestisci sessioni e clienti senza fogli Excel o caos WhatsApp.",
        stat: 1200,
        label: "Sessioni gestite",
      },
      {
        title: "Studi Fitness & Box",
        text: "Coordina trainer e clienti in un unico sistema di controllo.",
        stat: 340,
        label: "Clienti attivi",
      },
      {
        title: "Coach Online",
        text: "Programmi, progressi e comunicazione sincronizzati.",
        stat: 98,
        label: "Tasso di retention",
      },
    ],
    []
  );

  return (
    <section className="relative py-32 mt-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-blue-500/5" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-400/10 blur-[160px] rounded-full" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-semibold text-white">
            Creato per chi{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              vive di performance
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {cards.map((card, i) => (
            <CounterCard key={i} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CounterCard({
  card,
}: {
  card: { title: string; text: string; stat: number; label: string };
}) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({
    threshold: 0.35,
    rootMargin: "0px 0px -15% 0px",
  });

  return (
    <div
      ref={ref}
      className="group relative p-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(0,255,200,0.15)]"
    >
      <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,200,0.4)]">
        <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur-[1px]" />
      </div>

      <h3 className="text-xl font-semibold text-white mb-4">{card.title}</h3>
      <p className="text-white/60 mb-6">{card.text}</p>

      <div className="text-2xl font-semibold text-emerald-400">
        <Counter target={card.stat} start={inView} />{" "}
        <span className="text-white/50 text-base">{card.label}</span>
      </div>
    </div>
  );
}
