import { z } from "zod";

export const clientSessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.literal("CLIENT"),
  tenantId: z.string().nullable(),
});

export const trainerSummarySchema = z.object({
  id: z.string(),
  fullName: z.string().nullable(),
  email: z.string().email().nullable(),
});

export const workspaceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  email: z.string().email().nullable(),
});

export const clientSummarySchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  status: z.string(),
  tenantId: z.string().nullable(),
});

export const clientMeResponseSchema = z.object({
  user: clientSessionUserSchema,
  client: clientSummarySchema,
  hasTenant: z.boolean(),
  workspace: workspaceSummarySchema.nullable(),
  trainer: trainerSummarySchema.nullable(),
});

export const clientDashboardAppointmentSchema = z.object({
  id: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: z.string(),
  location: z.string().nullable(),
  locationType: z.string().nullable(),
});

export const clientDashboardPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  currentVersion: z.number().nullable(),
  updatedAt: z.string(),
});

export const clientDashboardProgressSchema = z.object({
  id: z.string(),
  weight: z.number().nullable(),
  createdAt: z.string(),
});

export const clientDashboardResponseSchema = z.object({
  hasTenant: z.boolean(),
  workspace: workspaceSummarySchema.nullable(),
  trainer: trainerSummarySchema.nullable(),
  nextAppointment: clientDashboardAppointmentSchema.nullable(),
  activePlan: clientDashboardPlanSchema.nullable(),
  latestProgress: clientDashboardProgressSchema.nullable(),
});

export const clientSessionSlotSchema = z.object({
  key: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  dayKey: z.string(),
  label: z.string(),
  isPast: z.boolean(),
  isBusy: z.boolean(),
  isAvailable: z.boolean(),
});

export const clientSessionsDaySchema = z.object({
  dayKey: z.string(),
  date: z.string(),
  dayNumber: z.number(),
  weekdayLabel: z.string(),
  fullLabel: z.string(),
  isToday: z.boolean(),
  availableCount: z.number(),
  busyCount: z.number(),
  slots: z.array(clientSessionSlotSchema),
});

export const clientSessionAppointmentSchema = z.object({
  id: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: z.string(),
  location: z.string().nullable(),
  locationType: z.string().nullable(),
  notes: z.string().nullable(),
});

export const clientSessionsResponseSchema = z.object({
  month: z.string(),
  monthLabel: z.string(),
  hasTenant: z.boolean(),
  availableCount: z.number(),
  busyCount: z.number(),
  nextMonth: z.string(),
  previousMonth: z.string(),
  bookedAppointments: z.array(clientSessionAppointmentSchema),
  days: z.array(clientSessionsDaySchema),
});

export const clientSessionBookingResponseSchema = z.object({
  appointment: clientSessionAppointmentSchema,
});

export const mobilePushRegistrationResponseSchema = z.object({
  ok: z.literal(true),
});

export const clientWorkoutItemSchema = z.object({
  id: z.string(),
  order: z.number(),
  name: z.string(),
  tips: z.string().nullable(),
  imageUrl: z.string().nullable(),
  sets: z.number().nullable(),
  reps: z.string().nullable(),
  restSec: z.number().nullable(),
  tempo: z.string().nullable(),
  rpe: z.number().nullable(),
  loadsKg: z.array(z.number()),
  restSecBySet: z.array(z.number()),
  itemNotes: z.string().nullable(),
  tags: z.array(z.string()),
});

export const clientWorkoutGroupSchema = z.object({
  key: z.string(),
  name: z.string(),
  order: z.number(),
  items: z.array(clientWorkoutItemSchema),
});

export const clientWorkoutsResponseSchema = z.object({
  hasActivePlan: z.boolean(),
  planName: z.string().nullable(),
  planNotes: z.string().nullable(),
  versionTitle: z.string().nullable(),
  versionNumber: z.number().nullable(),
  workouts: z.array(clientWorkoutGroupSchema),
});

export const mobileClientAuthSessionSchema = z.object({
  accessToken: z.string().min(1),
  user: clientSessionUserSchema,
  hasTenant: z.boolean(),
});

export const mobileClientInviteErrorSchema = z.enum([
  "INVITE_NOT_FOUND",
  "INVITE_REVOKED",
  "INVITE_ALREADY_USED",
  "INVITE_EXPIRED",
  "INVITE_EMAIL_MISMATCH",
  "USER_ALREADY_IN_OTHER_TENANT",
  "USER_NOT_FOUND",
  "INVALID_NAME",
  "INVALID_EMAIL",
  "INVALID_PASSWORD",
  "EMAIL_ALREADY_USED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INTERNAL_SERVER_ERROR",
]);

export const mobileClientInvitePreviewSchema = z.object({
  token: z.string(),
  email: z.string().email().nullable(),
  expiresAt: z.string().nullable(),
  workspace: workspaceSummarySchema,
  trainer: trainerSummarySchema.nullable(),
});

export const mobileClientInviteDetailsResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    invite: mobileClientInvitePreviewSchema,
  }),
  z.object({
    ok: z.literal(false),
    error: mobileClientInviteErrorSchema,
  }),
]);

export const mobileClientAcceptInviteResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    session: mobileClientAuthSessionSchema,
  }),
  z.object({
    ok: z.literal(false),
    error: mobileClientInviteErrorSchema,
  }),
]);

export type ClientSessionUser = z.infer<typeof clientSessionUserSchema>;
export type TrainerSummary = z.infer<typeof trainerSummarySchema>;
export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;
export type ClientSummary = z.infer<typeof clientSummarySchema>;
export type ClientMeResponse = z.infer<typeof clientMeResponseSchema>;
export type MobileClientAuthSession = z.infer<typeof mobileClientAuthSessionSchema>;
export type MobileClientInviteError = z.infer<typeof mobileClientInviteErrorSchema>;
export type MobileClientInvitePreview = z.infer<typeof mobileClientInvitePreviewSchema>;
export type MobileClientInviteDetailsResponse = z.infer<
  typeof mobileClientInviteDetailsResponseSchema
>;
export type MobileClientAcceptInviteResponse = z.infer<
  typeof mobileClientAcceptInviteResponseSchema
>;
export type ClientDashboardAppointment = z.infer<
  typeof clientDashboardAppointmentSchema
>;
export type ClientSessionSlot = z.infer<typeof clientSessionSlotSchema>;
export type ClientSessionsDay = z.infer<typeof clientSessionsDaySchema>;
export type ClientSessionAppointment = z.infer<typeof clientSessionAppointmentSchema>;
export type ClientSessionsResponse = z.infer<typeof clientSessionsResponseSchema>;
export type ClientSessionBookingResponse = z.infer<
  typeof clientSessionBookingResponseSchema
>;
export type MobilePushRegistrationResponse = z.infer<
  typeof mobilePushRegistrationResponseSchema
>;
export type ClientWorkoutItem = z.infer<typeof clientWorkoutItemSchema>;
export type ClientWorkoutGroup = z.infer<typeof clientWorkoutGroupSchema>;
export type ClientWorkoutsResponse = z.infer<typeof clientWorkoutsResponseSchema>;
export type ClientDashboardPlan = z.infer<typeof clientDashboardPlanSchema>;
export type ClientDashboardProgress = z.infer<
  typeof clientDashboardProgressSchema
>;
export type ClientDashboardResponse = z.infer<
  typeof clientDashboardResponseSchema
>;
