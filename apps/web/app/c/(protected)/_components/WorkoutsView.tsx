"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

type WorkoutItemView = {
  id: string;
  order: number;
  name: string;
  tips: string | null;
  imageUrl: string | null;
  sets: number | null;
  reps: string | null;
  restSec: number | null;
  tempo: string | null;
  rpe: number | null;
  loadsKg: number[];
  restSecBySet: number[];
  itemNotes: string | null;
  tags: string[];
};

type WorkoutGroupView = {
  key: string;
  name: string;
  order: number;
  items: WorkoutItemView[];
};

type WorkoutsViewProps = {
  planName: string;
  planNotes?: string | null;
  versionTitle: string;
  versionNumber: number;
  workouts: WorkoutGroupView[];
};

export default function WorkoutsView({
  planName,
  planNotes,
  versionTitle,
  versionNumber,
  workouts,
}: WorkoutsViewProps) {
  const sortedWorkouts = React.useMemo(
    () => [...workouts].sort((a, b) => a.order - b.order),
    [workouts]
  );

  const [openKey, setOpenKey] = React.useState<string | null>(
    sortedWorkouts[0]?.key ?? null
  );

  const sectionRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const pillRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const isProgrammaticScrollRef = React.useRef(false);

  function openWorkoutAndScroll(key: string) {
    setOpenKey(key);
    isProgrammaticScrollRef.current = true;

    requestAnimationFrame(() => {
      const el = sectionRefs.current[key];
      const pill = pillRefs.current[key];

      if (pill) {
        pill.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }

      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 140;

        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }

      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    });
  }

  function toggleWorkoutFromChevron(key: string) {
    const isOpen = openKey === key;

    if (isOpen) {
      setOpenKey(null);
      return;
    }

    openWorkoutAndScroll(key);
  }

  React.useEffect(() => {
    if (sortedWorkouts.length === 0) return;

    function onScroll() {
      if (isProgrammaticScrollRef.current) return;

      const sections = sortedWorkouts
        .map((workout) => {
          const el = sectionRefs.current[workout.key];
          if (!el) return null;

          const rect = el.getBoundingClientRect();

          return {
            key: workout.key,
            top: rect.top,
            distanceFromAnchor: Math.abs(rect.top - 160),
          };
        })
        .filter(Boolean) as {
        key: string;
        top: number;
        distanceFromAnchor: number;
      }[];

      if (sections.length === 0) return;

      const visible = sections
        .filter((section) => section.top <= 220)
        .sort((a, b) => b.top - a.top)[0];

      const closest =
        visible ||
        sections.sort(
          (a, b) => a.distanceFromAnchor - b.distanceFromAnchor
        )[0];

      if (!closest) return;

      setOpenKey((prev) => {
        if (prev === closest.key) return prev;

        const pill = pillRefs.current[closest.key];
        if (pill) {
          pill.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }

        return closest.key;
      });
    }

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sortedWorkouts]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
              Scheda attiva
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              {planName}
            </h1>

            <p className="mt-2 text-sm text-white/55">
              {versionTitle} · Versione {versionNumber}
            </p>

            {planNotes ? (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                {planNotes}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
            {sortedWorkouts.length} workout nella tua scheda
          </div>
        </div>
      </section>

      {sortedWorkouts.length > 0 ? (
        <div className="sticky top-3 z-20 -mx-1">
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2 rounded-[24px] border border-white/10 bg-black/20 px-3 py-3 backdrop-blur-xl">
              {sortedWorkouts.map((workout, index) => {
                const isActive = openKey === workout.key;

                return (
                  <button
                    key={workout.key}
                    ref={(el) => {
                      pillRefs.current[workout.key] = el;
                    }}
                    type="button"
                    onClick={() => openWorkoutAndScroll(workout.key)}
                    className={[
                      "group relative inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all duration-300",
                      isActive
                        ? "bg-white text-black shadow-sm"
                        : "border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white",
                    ].join(" ")}
                  >
                    <span className="text-[11px] opacity-70">{index + 1}</span>
                    <span className="font-medium">{workout.name}</span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px]",
                        isActive
                          ? "bg-black/10 text-black/70"
                          : "bg-white/[0.05] text-white/45",
                      ].join(" ")}
                    >
                      {workout.items.length}
                    </span>

                    <span
                      className={[
                        "absolute inset-x-3 -bottom-1 h-[2px] rounded-full transition-all duration-300",
                        isActive ? "bg-black/70 dark:bg-black/70" : "bg-transparent",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {sortedWorkouts.map((workout, workoutIndex) => {
          const isOpen = openKey === workout.key;

          return (
            <WorkoutAccordionCard
              key={workout.key}
              workout={workout}
              workoutIndex={workoutIndex}
              isOpen={isOpen}
              onCardOpen={() => {
                if (isOpen) return;
                openWorkoutAndScroll(workout.key);
              }}
              onChevronToggle={() => toggleWorkoutFromChevron(workout.key)}
              sectionRef={(el) => {
                sectionRefs.current[workout.key] = el;
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function WorkoutAccordionCard({
  workout,
  workoutIndex,
  isOpen,
  onCardOpen,
  onChevronToggle,
  sectionRef,
}: {
  workout: WorkoutGroupView;
  workoutIndex: number;
  isOpen: boolean;
  onCardOpen: () => void;
  onChevronToggle: () => void;
  sectionRef: (el: HTMLElement | null) => void;
}) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    if (!contentRef.current) return;
    setHeight(isOpen ? contentRef.current.scrollHeight : 0);
  }, [isOpen, workout.items.length]);

  React.useEffect(() => {
    function handleResize() {
      if (!contentRef.current) return;
      if (isOpen) setHeight(contentRef.current.scrollHeight);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  return (
    <section
      ref={sectionRef}
      className={[
        "scroll-mt-32 rounded-[28px] border backdrop-blur-xl transition-all duration-300",
        isOpen
          ? "border-white/14 bg-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
          : "border-white/10 bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4 p-5">
        <button
          type="button"
          onClick={onCardOpen}
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 text-left"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-white/40">
              Workout {workoutIndex + 1}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {workout.name}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {workout.items.length} esercizi
            </p>
          </div>

          <div
            className={[
              "hidden rounded-full border px-3 py-1 text-xs transition sm:block",
              isOpen
                ? "border-white/20 bg-white/[0.08] text-white"
                : "border-white/10 bg-white/[0.03] text-white/60",
            ].join(" ")}
          >
            {isOpen ? "Aperto" : "Apri"}
          </div>
        </button>

        <button
          type="button"
          onClick={onChevronToggle}
          aria-label={isOpen ? "Chiudi workout" : "Apri workout"}
          className={[
            "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-all duration-300",
            isOpen
              ? "border-white/20 bg-white/[0.08]"
              : "border-white/10 bg-white/[0.03]",
          ].join(" ")}
        >
          <ChevronDown
            className={[
              "h-4 w-4 text-white/70 transition-transform duration-300",
              isOpen ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>

      <div
        style={{ maxHeight: `${height}px` }}
        className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div
          ref={contentRef}
          className="border-t border-white/10 px-5 pb-5 pt-4"
        >
          <div className="space-y-4">
            {workout.items.map((item, index) => (
              <div
                key={item.id}
                className={[
                  "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
                  "transition-all duration-500 ease-out",
                  isOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0",
                ].join(" ")}
                style={{
                  transitionDelay: isOpen ? `${index * 45}ms` : "0ms",
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-white">
                      {item.order}. {item.name}
                    </div>

                    {item.tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={`${item.id}-${tag}`}
                            className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {item.tips ? (
                      <p className="mt-3 text-sm leading-6 text-white/55">
                        {item.tips}
                      </p>
                    ) : null}

                    {item.itemNotes ? (
                      <p className="mt-3 text-sm leading-6 text-white/45">
                        Nota: {item.itemNotes}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                    <MetricPill
                      label="Set"
                      value={item.sets != null ? String(item.sets) : "—"}
                    />
                    <MetricPill label="Reps" value={item.reps ?? "—"} />
                    <MetricPill
                      label="Rest"
                      value={item.restSec != null ? `${item.restSec}s` : "—"}
                    />
                    <MetricPill
                      label="RPE"
                      value={item.rpe != null ? String(item.rpe) : "—"}
                    />
                  </div>
                </div>

                {item.loadsKg.length > 0 || item.restSecBySet.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                      <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                        Carichi programmati
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        {item.loadsKg.length > 0
                          ? item.loadsKg.map((kg) => `${kg} kg`).join(" · ")
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                      <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                        Recupero per set
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        {item.restSecBySet.length > 0
                          ? item.restSecBySet.map((s) => `${s}s`).join(" · ")
                          : "—"}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}