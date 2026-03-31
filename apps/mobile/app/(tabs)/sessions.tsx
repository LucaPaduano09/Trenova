import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiClientError } from "@trenova/api-client";
import {
  getClientUserChannel,
  getTenantAvailabilityChannel,
} from "@trenova/contracts";
import { apiClient } from "@/src/lib/api";
import { AppScreen } from "@/src/components/AppScreen";
import { SurfaceCard } from "@/src/components/SurfaceCard";
import { useClientSessions } from "@/src/hooks/useClientSessions";
import { getMobileAblyClient } from "@/src/lib/realtime";
import { useAuth } from "@/src/providers/AuthProvider";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFullDateTime(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDayLabel(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatDateKeyFromValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getAppointmentTone(status: string) {
  switch (status) {
    case "PENDING":
      return {
        card: styles.bookingCardPending,
        badge: styles.bookingBadgePending,
        badgeText: styles.bookingBadgePendingText,
        label: "In attesa",
      };
    case "COMPLETED":
      return {
        card: styles.bookingCardCompleted,
        badge: styles.bookingBadgeCompleted,
        badgeText: styles.bookingBadgeCompletedText,
        label: "Completata",
      };
    case "CANCELED":
      return {
        card: styles.bookingCardCanceled,
        badge: styles.bookingBadgeCanceled,
        badgeText: styles.bookingBadgeCanceledText,
        label: "Cancellata",
      };
    default:
      return {
        card: styles.bookingCardScheduled,
        badge: styles.bookingBadgeScheduled,
        badgeText: styles.bookingBadgeScheduledText,
        label: "Prenotata",
      };
  }
}

export default function SessionsScreen() {
  const [month, setMonth] = useState(getCurrentMonthKey);
  const { error: authError, accessToken, me } = useAuth();
  const { data, loading, error, refetch } = useClientSessions(month);
  const [bookingSlotKey, setBookingSlotKey] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const days = data?.days ?? [];

  const daysWithActivity = useMemo(
    () =>
      days.filter(
        (day) =>
          day.slots.length > 0 ||
          (data?.bookedAppointments ?? []).some((appointment) =>
            appointment.startsAt.startsWith(day.dayKey)
          )
      ),
    [data?.bookedAppointments, days]
  );

  const firstActiveDayKey = daysWithActivity[0]?.dayKey ?? days[0]?.dayKey ?? null;

  const activeDay =
    days.find((day) => day.dayKey === (selectedDayKey ?? firstActiveDayKey)) ??
    days[0] ??
    null;

  const appointmentsByDay = useMemo(() => {
    const map = new Map<
      string,
      NonNullable<typeof data>["bookedAppointments"]
    >();

    for (const appointment of data?.bookedAppointments ?? []) {
      const key = formatDateKeyFromValue(appointment.startsAt);
      const current = map.get(key) ?? [];
      current.push(appointment);
      map.set(key, current);
    }

    return map;
  }, [data?.bookedAppointments]);

  const occupiedAppointmentsByDay = useMemo(() => {
    const map = new Map<
      string,
      NonNullable<typeof data>["bookedAppointments"]
    >();

    for (const appointment of data?.bookedAppointments ?? []) {
      if (appointment.status !== "PENDING" && appointment.status !== "SCHEDULED") {
        continue;
      }

      const key = formatDateKeyFromValue(appointment.startsAt);
      const current = map.get(key) ?? [];
      current.push(appointment);
      map.set(key, current);
    }

    return map;
  }, [data?.bookedAppointments]);

  const sessionGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        dayKey: string;
        label: string;
        appointments: NonNullable<typeof data>["bookedAppointments"];
      }
    >();

    for (const appointment of data?.bookedAppointments ?? []) {
      const dayKey = formatDateKeyFromValue(appointment.startsAt);
      const current = groups.get(dayKey) ?? {
        dayKey,
        label: formatShortDayLabel(appointment.startsAt),
        appointments: [],
      };

      current.appointments.push(appointment);
      groups.set(dayKey, current);
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      appointments: [...group.appointments].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
      ),
    }));
  }, [data?.bookedAppointments]);

  const activeDayAppointments = activeDay
    ? occupiedAppointmentsByDay.get(activeDay.dayKey) ?? []
    : [];
  const activeDayHistory = activeDay
    ? (appointmentsByDay.get(activeDay.dayKey) ?? []).filter(
        (appointment) =>
          appointment.status === "CANCELED" || appointment.status === "COMPLETED"
      )
    : [];
  const activeDayBusyCount = Math.max(
    activeDay?.busyCount ?? 0,
    occupiedAppointmentsByDay.get(activeDay?.dayKey ?? "")?.length ?? 0
  );

  useEffect(() => {
    if (!accessToken || !me?.user.id) {
      return;
    }

    const client = getMobileAblyClient(accessToken);

    if (!client) {
      return;
    }

    const cleanupFns: Array<() => void> = [];
    const handleRealtimeChange = () => {
      void refetch();
    };

    const userChannel = client.channels.get(getClientUserChannel(me.user.id));
    void userChannel.subscribe(handleRealtimeChange);
    cleanupFns.push(() => {
      void userChannel.unsubscribe(handleRealtimeChange);
    });

    if (me.client.tenantId) {
      const availabilityChannel = client.channels.get(
        getTenantAvailabilityChannel(me.client.tenantId)
      );
      void availabilityChannel.subscribe(handleRealtimeChange);
      cleanupFns.push(() => {
        void availabilityChannel.unsubscribe(handleRealtimeChange);
      });
    }

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [accessToken, me?.client.tenantId, me?.user.id, refetch]);

  const calendarCells = useMemo(() => {
    if (days.length === 0) {
      return [];
    }

    const firstDate = new Date(days[0].date);
    const jsWeekday = firstDate.getDay();
    const mondayIndex = (jsWeekday + 6) % 7;
    const leading = Array.from({ length: mondayIndex }, (_, index) => ({
      type: "empty" as const,
      key: `empty-${index}`,
    }));

    const mappedDays = days.map((day) => ({
      type: "day" as const,
      key: day.dayKey,
      day,
      hasBooking:
        (occupiedAppointmentsByDay.get(day.dayKey)?.length ?? 0) > 0,
    }));

    return [...leading, ...mappedDays];
  }, [days, occupiedAppointmentsByDay]);

  async function handleBookSlot(slotKey: string) {
    try {
      setBookingSlotKey(slotKey);
      setLocalInfo(null);
      setLocalError(null);
      await apiClient.bookClientSession({ slotKey });
      await refetch();
      setLocalInfo("Richiesta inviata. Il trainer dovra confermare la prenotazione.");
    } catch (nextError) {
      setLocalInfo(null);
      if (nextError instanceof ApiClientError) {
        switch (nextError.message) {
          case "SLOT_NOT_FOUND":
          case "SLOT_NOT_AVAILABLE":
          case "SLOT_ALREADY_BOOKED":
            setLocalError("Questo slot non e piu disponibile. Aggiorna e scegline un altro.");
            break;
          case "CLIENT_ALREADY_BOOKED":
            setLocalError("Hai gia una sessione prenotata in questo intervallo orario.");
            break;
          default:
            setLocalError("Non siamo riusciti a completare la prenotazione.");
        }
      } else {
        setLocalError("Non siamo riusciti a completare la prenotazione.");
      }
    } finally {
      setBookingSlotKey(null);
    }
  }

  return (
    <AppScreen
      title="Sessioni"
      subtitle="Calendario cliente, disponibilita reali del coach e una vista mobile piu immersiva."
      onRefresh={refetch}
      refreshing={loading}
    >
      <SurfaceCard style={styles.heroCard}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroContent}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroEyebrow}>Availability Capsule</Text>
              <Text style={styles.heroTitle}>
                {data?.monthLabel ?? "Disponibilita coach"}
              </Text>
            </View>
            <View style={styles.heroCounter}>
              <Text style={styles.heroCounterValue}>{data?.availableCount ?? 0}</Text>
              <Text style={styles.heroCounterLabel}>slot liberi</Text>
            </View>
          </View>

          <Text style={styles.heroText}>
            {data?.hasTenant
              ? "Una vista rapida delle finestre prenotabili, con enfasi sui giorni utili e sugli slot realmente disponibili."
              : "Il tuo account non e ancora collegato a un trainer, quindi qui compariranno le disponibilita appena verrai associato al tenant corretto."}
          </Text>

          <View style={styles.metricsRow}>
            <MetricBubble label="Liberi" value={String(data?.availableCount ?? 0)} tone="emerald" />
            <MetricBubble label="Occupati" value={String(data?.busyCount ?? 0)} tone="violet" />
            <MetricBubble label="Giorni attivi" value={String(daysWithActivity.length)} tone="cyan" />
          </View>
        </View>
      </SurfaceCard>

      <View style={styles.monthRow}>
        <Pressable
          style={styles.monthButton}
          onPress={() => setMonth(data?.previousMonth ?? month)}
        >
          <Text style={styles.monthButtonText}>Mese prec.</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{data?.monthLabel ?? "Calendario"}</Text>
        <Pressable
          style={styles.monthButton}
          onPress={() => setMonth(data?.nextMonth ?? month)}
        >
          <Text style={styles.monthButtonText}>Mese succ.</Text>
        </Pressable>
      </View>

      {!loading && (data?.bookedAppointments?.length ?? 0) > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Le tue sessioni</Text>
            <Text style={styles.sectionCaption}>
              Appointments reali del tuo account cliente per il mese selezionato.
            </Text>
          </View>

          <View style={styles.bookingStack}>
            {sessionGroups.map((group) => (
              <SurfaceCard key={group.dayKey} style={styles.bookingGroupCard}>
                <View style={styles.bookingGroupHeader}>
                  <View>
                    <Text style={styles.bookingGroupDay}>{group.label}</Text>
                    <Text style={styles.bookingGroupMeta}>
                      {group.appointments.length} sessioni registrate
                    </Text>
                  </View>
                  <View style={styles.bookingGroupPills}>
                    {group.appointments.some((item) => item.status === "SCHEDULED") ? (
                      <View style={[styles.miniPill, styles.miniPillScheduled]}>
                        <Text style={[styles.miniPillText, styles.miniPillScheduledText]}>
                          Confermata
                        </Text>
                      </View>
                    ) : null}
                    {group.appointments.some((item) => item.status === "PENDING") ? (
                      <View style={[styles.miniPill, styles.miniPillPending]}>
                        <Text style={[styles.miniPillText, styles.miniPillPendingText]}>
                          In attesa
                        </Text>
                      </View>
                    ) : null}
                    {group.appointments.some((item) => item.status === "CANCELED") ? (
                      <View style={[styles.miniPill, styles.miniPillCanceled]}>
                        <Text style={[styles.miniPillText, styles.miniPillCanceledText]}>
                          Annullata
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.bookingTimeline}>
                  {group.appointments.map((appointment) => {
                    const tone = getAppointmentTone(appointment.status);

                    return (
                      <View key={appointment.id} style={styles.bookingTimelineRow}>
                        <View style={styles.bookingTimelineRail}>
                          <View style={[styles.bookingTimelineDot, tone.badge]} />
                          <View style={styles.bookingTimelineLine} />
                        </View>
                        <View style={[styles.bookingTimelineCard, tone.card]}>
                          <View style={styles.bookingTimelineHeader}>
                            <View style={styles.bookingDateWrap}>
                              <Text style={styles.bookingTimelineTitle}>
                                {formatTime(appointment.startsAt)} -{" "}
                                {formatTime(appointment.endsAt)}
                              </Text>
                              <Text style={styles.bookingTime}>
                                {appointment.location
                                  ? `${appointment.locationType ?? "Sessione"} · ${appointment.location}`
                                  : appointment.locationType ?? "Dettagli sede non disponibili"}
                              </Text>
                            </View>
                            <View style={[styles.bookingBadge, tone.badge]}>
                              <Text style={[styles.bookingBadgeText, tone.badgeText]}>
                                {tone.label}
                              </Text>
                            </View>
                          </View>
                          {appointment.notes ? (
                            <Text style={styles.bookingNotes}>{appointment.notes}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </SurfaceCard>
            ))}
          </View>
        </>
      ) : null}

      {!loading && !error ? (
        <SurfaceCard style={styles.explainerCard}>
          <Text style={styles.sectionTitle}>Come usare questa schermata</Text>
          <Text style={styles.sectionText}>
            In alto trovi le sessioni che hai gia prenotato. Più sotto puoi
            sfogliare il calendario del tuo PT, selezionare un giorno e bloccare
            uno slot disponibile direttamente dall'app.
          </Text>
          {localInfo ? <Text style={styles.successText}>{localInfo}</Text> : null}
          {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
        </SurfaceCard>
      ) : null}

      {error ? (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Connessione non riuscita</Text>
          <Text style={styles.sectionText}>{error}</Text>
        </SurfaceCard>
      ) : null}

      {!loading && days.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Calendario PT</Text>
            <Text style={styles.sectionCaption}>
              Seleziona un giorno per vedere disponibilita e prenotazioni.
            </Text>
          </View>

          <SurfaceCard style={styles.calendarCard}>
            <View style={styles.weekHeader}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={styles.weekHeaderText}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarCells.map((cell) => {
                if (cell.type === "empty") {
                  return <View key={cell.key} style={styles.emptyCalendarCell} />;
                }

                const isActive =
                  cell.day.dayKey === (selectedDayKey ?? firstActiveDayKey);
                const hasAvailability = cell.day.availableCount > 0;
                const hasBusy =
                  cell.day.busyCount > 0 ||
                  (occupiedAppointmentsByDay.get(cell.day.dayKey)?.length ?? 0) > 0;

                return (
                  <Pressable
                    key={cell.key}
                    style={[
                      styles.calendarDay,
                      isActive && styles.calendarDayActive,
                      cell.day.isToday && styles.calendarDayToday,
                    ]}
                    onPress={() => setSelectedDayKey(cell.day.dayKey)}
                  >
                    <Text
                      style={[
                        styles.calendarDayNumber,
                        isActive && styles.calendarDayNumberActive,
                      ]}
                    >
                      {cell.day.dayNumber}
                    </Text>
                    <View style={styles.calendarIndicators}>
                      {hasAvailability ? (
                        <View style={[styles.calendarDot, styles.calendarDotAvailable]} />
                      ) : null}
                      {cell.hasBooking ? (
                        
                        <View style={[styles.calendarDot, styles.calendarDotBooked]} />
                      ) : null}
                      {!cell.hasBooking && !hasAvailability && hasBusy ? (
                        <View style={[styles.calendarDot, styles.calendarDotBusy]} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </SurfaceCard>

          {activeDay ? (
            <SurfaceCard style={styles.spotlightCard}>
              <View style={styles.spotlightHeader}>
                <View>
                  <Text style={styles.spotlightEyebrow}>Dettaglio giorno</Text>
                  <Text style={styles.spotlightTitle}>{activeDay.fullLabel}</Text>
                </View>
                {activeDay.isToday ? (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Oggi</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.spotlightSummary}>
                {activeDay.availableCount} slot disponibili e {activeDayBusyCount} gia
                occupati o prenotati.
              </Text>

              {activeDayAppointments.length > 0 ? (
                <View style={styles.bookedDayStack}>
                  {activeDayAppointments.map((appointment) => (
                    <View key={appointment.id} style={styles.bookedDayCard}>
                      <View style={styles.bookedDayHeader}>
                        <Text style={styles.bookedDayTime}>
                          {formatTime(appointment.startsAt)} -{" "}
                          {formatTime(appointment.endsAt)}
                        </Text>
                        <Text style={styles.bookedDayStatus}>
                          {appointment.status === "PENDING"
                            ? "Richiesta inviata"
                            : "Gia prenotata"}
                        </Text>
                      </View>
                      <Text style={styles.bookedDayMeta}>
                        {appointment.location
                          ? `${appointment.locationType ?? "Sessione"} · ${appointment.location}`
                          : appointment.locationType ?? "Dettagli sede non disponibili"}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {activeDayHistory.length > 0 ? (
                <View style={styles.dayHistoryCard}>
                  <Text style={styles.dayHistoryTitle}>Storico del giorno</Text>
                  <Text style={styles.dayHistoryText}>
                    Le richieste rifiutate o le sessioni annullate restano qui come
                    riferimento, ma non occupano piu gli slot disponibili.
                  </Text>
                  <View style={styles.dayHistoryList}>
                    {activeDayHistory.map((appointment) => {
                      const tone = getAppointmentTone(appointment.status);

                      return (
                        <View key={appointment.id} style={styles.dayHistoryRow}>
                          <Text style={styles.dayHistoryTime}>
                            {formatTime(appointment.startsAt)} -{" "}
                            {formatTime(appointment.endsAt)}
                          </Text>
                          <View style={[styles.bookingBadge, tone.badge]}>
                            <Text style={[styles.bookingBadgeText, tone.badgeText]}>
                              {tone.label}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {activeDay.slots.length > 0 ? (
                <View style={styles.slotGrid}>
                  {activeDay.slots.map((slot) => (
                    <View
                      key={slot.key}
                      style={[
                        styles.slotCard,
                        slot.isAvailable
                          ? styles.slotCardAvailable
                          : styles.slotCardBusy,
                      ]}
                    >
                      <Text style={styles.slotTime}>{slot.label}</Text>
                      <Text
                        style={[
                          styles.slotStatus,
                          slot.isAvailable
                            ? styles.slotStatusAvailable
                            : styles.slotStatusBusy,
                        ]}
                      >
                        {slot.isAvailable
                          ? "Prenotabile"
                          : slot.isBusy
                            ? "Occupato"
                            : "Passato"}
                      </Text>
                      <Text style={styles.slotMeta}>
                        {formatTime(slot.startsAt)} - {formatTime(slot.endsAt)}
                      </Text>
                      {slot.isAvailable ? (
                        <Pressable
                          style={[
                            styles.bookButton,
                            bookingSlotKey === slot.key && styles.bookButtonDisabled,
                          ]}
                          onPress={() => void handleBookSlot(slot.key)}
                          disabled={bookingSlotKey === slot.key}
                        >
                          <Text style={styles.bookButtonText}>
                            {bookingSlotKey === slot.key
                              ? "Invio richiesta..."
                              : "Richiedi prenotazione"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : activeDayAppointments.length > 0 ? (
                <Text style={styles.noFreeSlotText}>
                  In questo giorno non ci sono slot liberi visibili, ma hai gia una
                  sessione prenotata.
                </Text>
              ) : (
                <Text style={styles.noFreeSlotText}>
                  Il tuo PT non ha pubblicato orari prenotabili per questo giorno.
                </Text>
              )}
            </SurfaceCard>
          ) : null}
        </>
      ) : null}

      {!loading && days.length === 0 ? (
        <SurfaceCard style={styles.emptyCard}>
          <Text style={styles.sectionTitle}>Nessuna disponibilita per questo mese</Text>
          <Text style={styles.sectionText}>
            Appena il coach pubblichera slot liberi, li vedrai comparire qui con una
            vista per giorno e finestre prenotabili.
          </Text>
        </SurfaceCard>
      ) : null}
    </AppScreen>
  );
}

function MetricBubble({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "violet" | "cyan";
}) {
  return (
    <View style={[styles.metricBubble, toneStyles[tone]]}>
      <Text style={styles.metricBubbleValue}>{value}</Text>
      <Text style={styles.metricBubbleLabel}>{label}</Text>
    </View>
  );
}

const toneStyles = StyleSheet.create({
  emerald: {
    backgroundColor: "rgba(16,185,129,0.14)",
    borderColor: "rgba(52,211,153,0.22)",
  },
  violet: {
    backgroundColor: "rgba(129,140,248,0.14)",
    borderColor: "rgba(129,140,248,0.22)",
  },
  cyan: {
    backgroundColor: "rgba(34,211,238,0.14)",
    borderColor: "rgba(34,211,238,0.22)",
  },
});

const styles = StyleSheet.create({
  heroCard: {
    overflow: "hidden",
    padding: 0,
    backgroundColor: "#101A31",
  },
  heroGlowA: {
    position: "absolute",
    top: -30,
    right: -10,
    height: 140,
    width: 140,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.22)",
  },
  heroGlowB: {
    position: "absolute",
    bottom: -36,
    left: -18,
    height: 150,
    width: 150,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.16)",
  },
  heroContent: {
    padding: 20,
    gap: 18,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  heroEyebrow: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 8,
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  heroCounter: {
    minWidth: 92,
    alignItems: "flex-end",
  },
  heroCounterValue: {
    color: "#ECFDF5",
    fontSize: 34,
    fontWeight: "800",
  },
  heroCounterLabel: {
    color: "#A7F3D0",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  heroText: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 460,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricBubble: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  metricBubbleValue: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  metricBubbleLabel: {
    marginTop: 6,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  monthButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17,26,46,0.72)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  monthButtonText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
  },
  monthLabel: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
  },
  sectionCaption: {
    color: "#94A3B8",
    fontSize: 13,
  },
  sectionText: {
    marginTop: 10,
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
  },
  calendarCard: {
    gap: 14,
    backgroundColor: "rgba(13,20,38,0.84)",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  emptyCalendarCell: {
    width: "13.4%",
    aspectRatio: 1,
  },
  calendarDay: {
    width: "13.4%",
    aspectRatio: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17,26,46,0.68)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  calendarDayActive: {
    backgroundColor: "#F8FAFC",
    borderColor: "#F8FAFC",
  },
  calendarDayToday: {
    borderColor: "rgba(34,211,238,0.45)",
  },
  calendarDayNumber: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  calendarDayNumberActive: {
    color: "#0F172A",
  },
  calendarIndicators: {
    marginTop: 6,
    flexDirection: "row",
    gap: 4,
    minHeight: 8,
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  calendarDotAvailable: {
    backgroundColor: "#34D399",
  },
  calendarDotBooked: {
    backgroundColor: "#60A5FA",
  },
  calendarDotBusy: {
    backgroundColor: "#A78BFA",
  },
  spotlightCard: {
    gap: 16,
    backgroundColor: "rgba(13,20,38,0.84)",
  },
  spotlightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  spotlightEyebrow: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  spotlightTitle: {
    marginTop: 6,
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
  },
  todayBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.14)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  todayBadgeText: {
    color: "#A7F3D0",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  spotlightSummary: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
  },
  slotGrid: {
    gap: 12,
  },
  slotCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  slotCardAvailable: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderColor: "rgba(52,211,153,0.18)",
  },
  slotCardBusy: {
    backgroundColor: "rgba(129,140,248,0.08)",
    borderColor: "rgba(129,140,248,0.14)",
  },
  slotTime: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  slotStatus: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  slotStatusAvailable: {
    color: "#A7F3D0",
  },
  slotStatusBusy: {
    color: "#C7D2FE",
  },
  slotMeta: {
    marginTop: 8,
    color: "#CBD5E1",
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: "rgba(17,26,46,0.72)",
  },
  explainerCard: {
    backgroundColor: "rgba(17,26,46,0.72)",
  },
  bookingStack: {
    gap: 12,
  },
  bookingGroupCard: {
    gap: 16,
    backgroundColor: "rgba(8,15,31,0.78)",
  },
  bookingGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  bookingGroupDay: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  bookingGroupMeta: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  bookingGroupPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
    maxWidth: 150,
  },
  miniPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  miniPillText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  miniPillScheduled: {
    backgroundColor: "rgba(59,130,246,0.14)",
    borderColor: "rgba(96,165,250,0.18)",
  },
  miniPillScheduledText: {
    color: "#BFDBFE",
  },
  miniPillPending: {
    backgroundColor: "rgba(245,158,11,0.14)",
    borderColor: "rgba(251,191,36,0.18)",
  },
  miniPillPendingText: {
    color: "#FDE68A",
  },
  miniPillCanceled: {
    backgroundColor: "rgba(244,63,94,0.12)",
    borderColor: "rgba(251,113,133,0.18)",
  },
  miniPillCanceledText: {
    color: "#FDA4AF",
  },
  bookingTimeline: {
    gap: 10,
  },
  bookingTimelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  bookingTimelineRail: {
    width: 14,
    alignItems: "center",
  },
  bookingTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 0,
    marginTop: 12,
  },
  bookingTimelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: "rgba(148,163,184,0.18)",
    marginTop: 6,
  },
  bookingTimelineCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  bookingTimelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  bookingTimelineTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  bookingCard: {
    gap: 10,
  },
  bookingCardScheduled: {
    backgroundColor: "rgba(8,15,31,0.84)",
  },
  bookingCardPending: {
    backgroundColor: "rgba(245,158,11,0.10)",
    borderColor: "rgba(251,191,36,0.18)",
  },
  bookingCardCompleted: {
    backgroundColor: "rgba(16,185,129,0.10)",
    borderColor: "rgba(52,211,153,0.18)",
  },
  bookingCardCanceled: {
    backgroundColor: "rgba(244,63,94,0.08)",
    borderColor: "rgba(251,113,133,0.16)",
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  bookingDateWrap: {
    flex: 1,
  },
  bookingDate: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  bookingTime: {
    marginTop: 6,
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
  },
  bookingBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  bookingBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  bookingBadgeScheduled: {
    backgroundColor: "rgba(59,130,246,0.14)",
    borderColor: "rgba(96,165,250,0.18)",
  },
  bookingBadgeScheduledText: {
    color: "#BFDBFE",
  },
  bookingBadgePending: {
    backgroundColor: "rgba(245,158,11,0.14)",
    borderColor: "rgba(251,191,36,0.18)",
  },
  bookingBadgePendingText: {
    color: "#FDE68A",
  },
  bookingBadgeCompleted: {
    backgroundColor: "rgba(16,185,129,0.14)",
    borderColor: "rgba(52,211,153,0.18)",
  },
  bookingBadgeCompletedText: {
    color: "#A7F3D0",
  },
  bookingBadgeCanceled: {
    backgroundColor: "rgba(244,63,94,0.12)",
    borderColor: "rgba(251,113,133,0.18)",
  },
  bookingBadgeCanceledText: {
    color: "#FDA4AF",
  },
  bookingMeta: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
  bookingNotes: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  bookedDayStack: {
    gap: 10,
  },
  bookedDayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.18)",
    backgroundColor: "rgba(59,130,246,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  bookedDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  bookedDayTime: {
    color: "#EFF6FF",
    fontSize: 15,
    fontWeight: "800",
  },
  bookedDayStatus: {
    color: "#BFDBFE",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  bookedDayMeta: {
    color: "#DBEAFE",
    fontSize: 13,
    lineHeight: 20,
  },
  dayHistoryCard: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
    backgroundColor: "rgba(15,23,42,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dayHistoryTitle: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  dayHistoryText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  dayHistoryList: {
    gap: 8,
  },
  dayHistoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    paddingTop: 4,
  },
  dayHistoryTime: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
  },
  noFreeSlotText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  successText: {
    marginTop: 12,
    color: "#A7F3D0",
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 12,
    color: "#FCA5A5",
    fontSize: 14,
    lineHeight: 20,
  },
  bookButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    borderRadius: 14,
    backgroundColor: "#34D399",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bookButtonDisabled: {
    opacity: 0.55,
  },
  bookButtonText: {
    color: "#042F2E",
    fontSize: 13,
    fontWeight: "800",
  },
});
