export type AvailabilityCalendarSlot = {
  id: string;
  date: Date;
  startAt: Date;
  endAt: Date;
  isAvailable: boolean;
};

export type BusyAppointment = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
};

export type SessionCalendarSlot = {
  key: string;
  startsAt: Date;
  endsAt: Date;
  dayKey: string;
  label: string;
  isPast: boolean;
  isBusy: boolean;
  isAvailable: boolean;
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  apptStart: Date,
  apptEnd: Date
) {
  return slotStart < apptEnd && slotEnd > apptStart;
}

export function buildClientCalendarFromAvailabilitySlots(args: {
  availabilitySlots: AvailabilityCalendarSlot[];
  busyAppointments: BusyAppointment[];
}) {
  const { availabilitySlots, busyAppointments } = args;
  const now = new Date();

  const slots: SessionCalendarSlot[] = availabilitySlots
    .filter((slot) => slot.isAvailable)
    .map((slot) => {
      const slotStart = new Date(slot.startAt);
      const slotEnd = new Date(slot.endAt);

      const isPast = slotEnd <= now;

      const isBusy = busyAppointments.some((appt) =>
        overlaps(
          slotStart,
          slotEnd,
          new Date(appt.startsAt),
          new Date(appt.endsAt)
        )
      );

      const dayKey = slotStart.toISOString().slice(0, 10);

      return {
        key: slot.id,
        startsAt: slotStart,
        endsAt: slotEnd,
        dayKey,
        label: `${formatTime(slotStart)} · ${formatTime(slotEnd)}`,
        isPast,
        isBusy,
        isAvailable: !isPast && !isBusy,
      };
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return slots;
}