export type RealtimeEventName =
  | "availability.updated"
  | "booking.requested"
  | "booking.approved"
  | "booking.rejected"
  | "notifications.updated";

export function getTrainerTenantChannel(tenantId: string) {
  return `tenant:${tenantId}:trainers`;
}

export function getTenantAvailabilityChannel(tenantId: string) {
  return `tenant:${tenantId}:availability`;
}

export function getClientUserChannel(userId: string) {
  return `client:${userId}`;
}
