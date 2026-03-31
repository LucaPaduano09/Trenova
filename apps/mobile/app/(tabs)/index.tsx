import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/src/components/AppScreen";
import { BrandMark } from "@/src/components/BrandMark";
import { Reveal } from "@/src/components/Reveal";
import { SurfaceCard } from "@/src/components/SurfaceCard";
import { useClientDashboard } from "@/src/hooks/useClientDashboard";
import { useAuth } from "@/src/providers/AuthProvider";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Nessuna sessione pianificata";
  }

  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return "Nessun dato";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ClientHomeScreen() {
  const { me } = useAuth();
  const { data, loading, error, refetch, unauthorized } = useClientDashboard();

  const firstName =
    me?.client.fullName?.split(" ")[0] ??
    me?.user.name?.split(" ")[0] ??
    "Cliente";

  return (
    <AppScreen
      title={`Ciao ${firstName}`}
      subtitle=""
      onRefresh={refetch}
      refreshing={loading}
    >
      {unauthorized ? (
        <SurfaceCard>
          <Text style={styles.cardTitle}>Accesso richiesto</Text>
          <Text style={styles.cardText}>
            Per vedere i tuoi dati devi prima autenticarti come cliente.
          </Text>
          <Link href="/sign-in" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Vai al login</Text>
            </Pressable>
          </Link>
        </SurfaceCard>
      ) : null}

      {error && !unauthorized ? (
        <SurfaceCard>
          <Text style={styles.cardTitle}>Connessione non riuscita</Text>
          <Text style={styles.cardText}>{error}</Text>
        </SurfaceCard>
      ) : null}

      <Reveal delay={50}>
        <SurfaceCard style={styles.heroCard}>
          <View style={styles.heroGlowA} />
          <View style={styles.heroGlowB} />
          <View style={styles.heroOrbit} />
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <View style={styles.heroCopy}>
                <BrandMark size="md" />
                <Text style={styles.heroEyebrow}>Overview</Text>
                <Text style={styles.heroTitle}>
                  {data?.workspace?.name ?? "Il tuo spazio Trenova"}
                </Text>
                <Text style={styles.heroSubtitle}>
                  {data?.hasTenant
                    ? `Seguito da ${data?.trainer?.fullName ?? "il tuo coach"}, con una vista rapida su appuntamenti, scheda attiva e progressi recenti.`
                    : "Il tuo account è pronto. Appena verrai collegato a un personal trainer, qui compariranno sessioni, workout e aggiornamenti."}
                </Text>
              </View>

              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeValue}>
                  {data?.nextAppointment ? "LIVE" : "READY"}
                </Text>
                <Text style={styles.heroBadgeLabel}>status</Text>
              </View>
            </View>

            <View style={styles.heroStats}>
              <QuickMetric
                label="Prossima sessione"
                value={
                  data?.nextAppointment
                    ? formatDateTime(data.nextAppointment.startsAt)
                    : "Da pianificare"
                }
              />
              <QuickMetric
                label="Scheda attiva"
                value={data?.activePlan?.title ?? "Non assegnata"}
              />
            </View>
          </View>
        </SurfaceCard>
      </Reveal>

      <Reveal delay={140}>
        <View style={styles.quickGrid}>
          <QuickAction
            title="Sessioni"
            description="Controlla il calendario del PT e prenota."
            href="/sessions"
            tone="emerald"
          />
          <QuickAction
            title="Workout"
            description="Apri la scheda attiva e segui gli esercizi."
            href="/workouts"
            tone="cyan"
          />
        </View>
      </Reveal>

      <Reveal delay={220}>
        <View style={styles.insightGrid}>
          <SurfaceCard style={styles.insightCard}>
          <Text style={styles.insightLabel}>Prossima sessione</Text>
          <Text style={styles.insightValue}>
            {formatDateTime(data?.nextAppointment?.startsAt)}
          </Text>
          <Text style={styles.insightHint}>
            {data?.nextAppointment?.locationType ?? "Dettagli appuntamento"}
          </Text>
          </SurfaceCard>

          <SurfaceCard style={styles.insightCard}>
            <Text style={styles.insightLabel}>Ultimo progresso</Text>
            <Text style={styles.insightValue}>
              {data?.latestProgress?.weight != null
                ? `${data.latestProgress.weight} kg`
                : "Nessun check-in"}
            </Text>
            <Text style={styles.insightHint}>
              {formatShortDate(data?.latestProgress?.createdAt)}
            </Text>
          </SurfaceCard>
        </View>
      </Reveal>

      <Reveal delay={300}>
        <SurfaceCard style={styles.journeyCard}>
        <Text style={styles.cardTitle}>Momento attuale</Text>
        <Text style={styles.cardText}>
          {data?.activePlan?.currentVersion != null
            ? `Stai seguendo la versione ${data.activePlan.currentVersion} della tua scheda attiva.`
            : "Non hai ancora una versione scheda attiva assegnata."}
        </Text>
        <View style={styles.journeyTrack}>
          <View style={[styles.journeySegment, styles.journeySegmentDone]} />
          <View
            style={[
              styles.journeySegment,
              data?.activePlan ? styles.journeySegmentDone : styles.journeySegmentPending,
            ]}
          />
          <View
            style={[
              styles.journeySegment,
              data?.latestProgress ? styles.journeySegmentDone : styles.journeySegmentPending,
            ]}
          />
        </View>
        <Text style={styles.journeyLegend}>
          Account attivo · Scheda disponibile · Progressi monitorati
        </Text>
        </SurfaceCard>
      </Reveal>
    </AppScreen>
  );
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.quickMetric}>
      <Text style={styles.quickMetricLabel}>{label}</Text>
      <Text style={styles.quickMetricValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function QuickAction({
  title,
  description,
  href,
  tone,
}: {
  title: string;
  description: string;
  href: "/sessions" | "/workouts";
  tone: "emerald" | "cyan";
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={[
          styles.actionCard,
          tone === "emerald" ? styles.actionCardEmerald : styles.actionCardCyan,
        ]}
      >
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
        <Text style={styles.actionLink}>Apri</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    overflow: "hidden",
    padding: 0,
    backgroundColor: "#0F172A",
  },
  heroGlowA: {
    position: "absolute",
    top: -32,
    right: -10,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.18)",
  },
  heroGlowB: {
    position: "absolute",
    bottom: -48,
    left: -18,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.16)",
  },
  heroOrbit: {
    position: "absolute",
    top: 20,
    right: 26,
    width: 108,
    height: 108,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  heroContent: {
    padding: 20,
    gap: 18,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroEyebrow: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
  },
  heroBadge: {
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  heroBadgeValue: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  heroBadgeLabel: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
  },
  quickMetric: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 14,
  },
  quickMetricLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  quickMetricValue: {
    marginTop: 8,
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    minHeight: 150,
    justifyContent: "space-between",
  },
  actionCardEmerald: {
    backgroundColor: "rgba(16,185,129,0.10)",
    borderColor: "rgba(52,211,153,0.18)",
  },
  actionCardCyan: {
    backgroundColor: "rgba(56,189,248,0.10)",
    borderColor: "rgba(125,211,252,0.18)",
  },
  actionTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
  },
  actionDescription: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
  actionLink: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  insightGrid: {
    gap: 12,
  },
  insightCard: {
    gap: 8,
    backgroundColor: "rgba(17,26,46,0.78)",
  },
  insightLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  insightValue: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  insightHint: {
    color: "#CBD5E1",
    fontSize: 13,
  },
  journeyCard: {
    backgroundColor: "rgba(17,26,46,0.78)",
  },
  cardTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
  },
  cardText: {
    marginTop: 10,
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
  },
  journeyTrack: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  journeySegment: {
    flex: 1,
    height: 10,
    borderRadius: 999,
  },
  journeySegmentDone: {
    backgroundColor: "#34D399",
  },
  journeySegmentPending: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  journeyLegend: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    borderRadius: 16,
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#052E25",
    fontSize: 15,
    fontWeight: "700",
  },
});
