import { z } from "zod";

export const createEntrySchema = z.object({
  clientId: z.string().min(1),
  measuredAt: z.string().optional().or(z.literal("")),
  weightKg: z.string().optional().or(z.literal("")),
  waistCm: z.string().optional().or(z.literal("")),
  hipsCm: z.string().optional().or(z.literal("")),
  armRmm: z.string().optional().or(z.literal("")),
  armLmm: z.string().optional().or(z.literal("")),
  forearmRmm: z.string().optional().or(z.literal("")),
  forearmLmm: z.string().optional().or(z.literal("")),
  thighRmm: z.string().optional().or(z.literal("")),
  thighLmm: z.string().optional().or(z.literal("")),
  calfLmm: z.string().optional().or(z.literal("")),
  calfRmm: z.string().optional().or(z.literal("")),
  bodyFatPct: z.string().optional().or(z.literal("")),
  tbwPct: z.string().optional().or(z.literal("")),
  icwPct: z.string().optional().or(z.literal("")),
  ecwPct: z.string().optional().or(z.literal("")),
  muscleKg: z.string().optional().or(z.literal("")),
  fatKg: z.string().optional().or(z.literal("")),
  ffmKg: z.string().optional().or(z.literal("")),
  bmrKcal: z.string().optional().or(z.literal("")),
  visceralFat: z.string().optional().or(z.literal("")),
  metabolicAge: z.string().optional().or(z.literal("")),
  phaseAngle: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CreateMetricsEntryState =
  | { ok: true; entryId: string }
  | { ok: false; error: Record<string, string[]> };

export const createMetricsInitialState: CreateMetricsEntryState = {
  ok: false,
  error: {},
};