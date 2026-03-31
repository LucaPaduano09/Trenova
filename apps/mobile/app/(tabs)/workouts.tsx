import { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppScreen } from "@/src/components/AppScreen";
import { SurfaceCard } from "@/src/components/SurfaceCard";
import { useClientWorkouts } from "@/src/hooks/useClientWorkouts";

function buildSetRows(args: {
  sets: number | null;
  loadsKg: number[];
  restSecBySet: number[];
}) {
  const totalSets = Math.max(
    args.sets ?? 0,
    args.loadsKg.length,
    args.restSecBySet.length
  );

  return Array.from({ length: totalSets }, (_, index) => ({
    setNumber: index + 1,
    loadKg:
      typeof args.loadsKg[index] === "number" ? `${args.loadsKg[index]} kg` : "—",
    restSec:
      typeof args.restSecBySet[index] === "number"
        ? `${args.restSecBySet[index]} s`
        : "—",
  }));
}

export default function WorkoutsScreen() {
  const { data, loading, error, refetch } = useClientWorkouts();
  const [activeWorkoutKey, setActiveWorkoutKey] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const workouts = data?.workouts ?? [];
  const currentWorkout =
    workouts.find((item) => item.key === (activeWorkoutKey ?? workouts[0]?.key)) ??
    workouts[0] ??
    null;

  const totalExercises = useMemo(() => {
    return workouts.reduce((total, workout) => total + workout.items.length, 0);
  }, [workouts]);

  const selectedExercise =
    currentWorkout?.items.find((item) => item.id === selectedExerciseId) ?? null;
  const selectedExerciseSetRows = selectedExercise
    ? buildSetRows({
        sets: selectedExercise.sets,
        loadsKg: selectedExercise.loadsKg,
        restSecBySet: selectedExercise.restSecBySet,
      })
    : [];

  return (
    <AppScreen
      title="Workout"
      subtitle="Scheda cliente con gruppi, esercizi e un layout piu editoriale."
      onRefresh={refetch}
      refreshing={loading}
    >
      <SurfaceCard style={styles.heroCard}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Active Plan</Text>
          <Text style={styles.heroTitle}>
            {data?.planName ?? "Nessuna scheda attiva"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {data?.versionTitle && data?.versionNumber != null
              ? `${data.versionTitle} · Versione ${data.versionNumber}`
              : "Appena il coach assegnera una programmazione valida, la vedrai comparire qui con tutti i workout organizzati."}
          </Text>

          <View style={styles.heroStats}>
            <WorkoutStat value={String(workouts.length)} label="workout" />
            <WorkoutStat value={String(totalExercises)} label="esercizi" />
            <WorkoutStat
              value={String(currentWorkout?.items.length ?? 0)}
              label="in focus"
            />
          </View>

          {data?.planNotes ? (
            <Text style={styles.heroNotes}>{data.planNotes}</Text>
          ) : null}
        </View>
      </SurfaceCard>

      {error ? (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Connessione non riuscita</Text>
          <Text style={styles.sectionText}>{error}</Text>
        </SurfaceCard>
      ) : null}

      {!loading && workouts.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Navigator</Text>
            <Text style={styles.sectionCaption}>
              Un accesso rapido ai blocchi della tua scheda.
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workoutRail}
          >
            {workouts.map((workout, index) => {
              const isActive =
                workout.key === (activeWorkoutKey ?? workouts[0]?.key);

              return (
                <Pressable
                  key={workout.key}
                  style={[styles.workoutPill, isActive && styles.workoutPillActive]}
                  onPress={() => setActiveWorkoutKey(workout.key)}
                >
                  <Text
                    style={[
                      styles.workoutPillIndex,
                      isActive && styles.workoutPillIndexActive,
                    ]}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                  <Text
                    style={[
                      styles.workoutPillName,
                      isActive && styles.workoutPillNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {workout.name}
                  </Text>
                  <Text
                    style={[
                      styles.workoutPillMeta,
                      isActive && styles.workoutPillMetaActive,
                    ]}
                  >
                    {workout.items.length} esercizi
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {currentWorkout ? (
            <SurfaceCard style={styles.focusCard}>
              <View style={styles.focusHeader}>
                <View style={styles.focusTitleWrap}>
                  <Text style={styles.focusEyebrow}>Workout Focus</Text>
                  <Text style={styles.focusTitle}>{currentWorkout.name}</Text>
                  <Text style={styles.focusCaption}>
                    {currentWorkout.items.length} esercizi ordinati come nella scheda
                    attiva.
                  </Text>
                </View>
                <View style={styles.focusBadge}>
                  <Text style={styles.focusBadgeText}>LIVE</Text>
                </View>
              </View>

              <View style={styles.exerciseStack}>
                {currentWorkout.items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.exerciseCard}
                    onPress={() => setSelectedExerciseId(item.id)}
                  >
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>
                          {String(item.order).padStart(2, "0")}
                        </Text>
                      </View>
                      <View style={styles.exerciseHeaderText}>
                        <Text style={styles.exerciseName}>{item.name}</Text>
                        <Text style={styles.exercisePreview}>
                          {item.tips?.trim() ||
                            item.itemNotes?.trim() ||
                            "Tocca per vedere serie, reps, recuperi e dettagli completi."}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.exerciseTapHint}>Apri dettaglio</Text>
                  </Pressable>
                ))}
              </View>
            </SurfaceCard>
          ) : null}
        </>
      ) : null}

      {!loading && workouts.length === 0 ? (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Nessuna scheda attiva</Text>
          <Text style={styles.sectionText}>
            Quando il tuo coach assegnera una programmazione, qui troverai i workout
            raggruppati e gli esercizi gia pronti da consultare.
          </Text>
        </SurfaceCard>
      ) : null}

      <Modal
        visible={!!selectedExercise}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExerciseId(null)}
      >
        <View style={styles.modalScreen}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalTopBar}>
              <Text style={styles.modalEyebrow}>Exercise Detail</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setSelectedExerciseId(null)}
              >
                <Text style={styles.modalCloseButtonText}>Chiudi</Text>
              </Pressable>
            </View>

            {selectedExercise ? (
              <>
                <View style={styles.modalHero}>
                  <View style={styles.modalExerciseNumber}>
                    <Text style={styles.modalExerciseNumberText}>
                      {String(selectedExercise.order).padStart(2, "0")}
                    </Text>
                  </View>
                  <Text style={styles.modalExerciseName}>{selectedExercise.name}</Text>
                  <Text style={styles.modalExerciseDescription}>
                    {selectedExercise.tips?.trim() ||
                      "Dettaglio completo dell'esercizio selezionato."}
                  </Text>
                </View>

                {selectedExercise.tags.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagRail}
                  >
                    {selectedExercise.tags.map((tag) => (
                      <View key={`${selectedExercise.id}-${tag}`} style={styles.tagPill}>
                        <Text style={styles.tagPillText}>{tag}</Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : null}

                {selectedExercise.imageUrl ? (
                  <Image
                    source={{ uri: selectedExercise.imageUrl }}
                    style={styles.exerciseImage}
                  />
                ) : null}

                <SurfaceCard style={styles.prescriptionCard}>
                  <Text style={styles.detailCardTitle}>Prescription</Text>
                  <View style={styles.metricGrid}>
                    <ExerciseMetric
                      label="Set"
                      value={
                        selectedExercise.sets != null ? String(selectedExercise.sets) : "—"
                      }
                    />
                    <ExerciseMetric label="Reps" value={selectedExercise.reps ?? "—"} />
                    <ExerciseMetric
                      label="Carico"
                      value={
                        selectedExercise.loadsKg.length > 0
                          ? `${selectedExercise.loadsKg[0]} kg`
                          : "—"
                      }
                    />
                    <ExerciseMetric
                      label="Rest"
                      value={
                        selectedExercise.restSec != null
                          ? `${selectedExercise.restSec}s`
                          : "—"
                      }
                    />
                  </View>
                </SurfaceCard>

                {selectedExerciseSetRows.length > 0 ? (
                  <SurfaceCard style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Breakdown per set</Text>
                    <View style={styles.setTableHeader}>
                      <Text style={[styles.setHeaderCell, styles.setHeaderIndex]}>
                        Set
                      </Text>
                      <Text style={styles.setHeaderCell}>Carico</Text>
                      <Text style={styles.setHeaderCell}>Recupero</Text>
                    </View>
                    <View style={styles.setTable}>
                      {selectedExerciseSetRows.map((row) => (
                        <View key={`set-${row.setNumber}`} style={styles.setRow}>
                          <View style={styles.setIndexPill}>
                            <Text style={styles.setIndexText}>{row.setNumber}</Text>
                          </View>
                          <Text style={styles.setValueText}>{row.loadKg}</Text>
                          <Text style={styles.setValueText}>{row.restSec}</Text>
                        </View>
                      ))}
                    </View>
                  </SurfaceCard>
                ) : null}

                {selectedExercise.itemNotes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Nota coach</Text>
                    <Text style={styles.notesText}>{selectedExercise.itemNotes}</Text>
                  </View>
                ) : null}


              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </AppScreen>
  );
}

function WorkoutStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ExerciseMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    overflow: "hidden",
    padding: 0,
    backgroundColor: "#10182D",
  },
  heroOrbA: {
    position: "absolute",
    top: -40,
    right: -8,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.18)",
  },
  heroOrbB: {
    position: "absolute",
    bottom: -56,
    left: -24,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.16)",
  },
  heroContent: {
    padding: 20,
    gap: 16,
  },
  heroEyebrow: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statValue: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 6,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  heroNotes: {
    color: "#BFDBFE",
    fontSize: 14,
    lineHeight: 22,
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
  workoutRail: {
    gap: 12,
    paddingRight: 6,
  },
  workoutPill: {
    width: 150,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17,26,46,0.72)",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  workoutPillActive: {
    backgroundColor: "#F8FAFC",
    borderColor: "#F8FAFC",
  },
  workoutPillIndex: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  workoutPillIndexActive: {
    color: "#475569",
  },
  workoutPillName: {
    marginTop: 10,
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  workoutPillNameActive: {
    color: "#0F172A",
  },
  workoutPillMeta: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  workoutPillMetaActive: {
    color: "#334155",
  },
  focusCard: {
    gap: 18,
    backgroundColor: "rgba(13,20,38,0.86)",
  },
  focusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  focusTitleWrap: {
    flex: 1,
  },
  focusEyebrow: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  focusTitle: {
    marginTop: 6,
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  focusCaption: {
    marginTop: 8,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  focusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
    backgroundColor: "rgba(34,197,94,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  focusBadgeText: {
    color: "#86EFAC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  exerciseStack: {
    gap: 14,
  },
  exerciseCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    gap: 14,
  },
  exerciseHeader: {
    flexDirection: "row",
    gap: 12,
  },
  exerciseNumber: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56,189,248,0.14)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.16)",
  },
  exerciseNumberText: {
    color: "#E0F2FE",
    fontSize: 14,
    fontWeight: "800",
  },
  exerciseHeaderText: {
    flex: 1,
    gap: 8,
  },
  exerciseName: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  exercisePreview: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  exerciseTapHint: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  tagRail: {
    gap: 8,
    paddingRight: 6,
  },
  tagPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagPillText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },
  exerciseImage: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: "#0F172A",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    minWidth: 82,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(8,15,31,0.72)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  metricValue: {
    marginTop: 6,
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  exerciseDescription: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  notesBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.14)",
    backgroundColor: "rgba(59,130,246,0.08)",
    padding: 14,
    gap: 6,
  },
  notesLabel: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  notesText: {
    color: "#DBEAFE",
    fontSize: 14,
    lineHeight: 20,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: "#09111F",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16,
  },
  modalTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  modalEyebrow: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  modalCloseButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalCloseButtonText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },
  modalHero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17,26,46,0.80)",
    padding: 18,
    gap: 12,
  },
  modalExerciseNumber: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56,189,248,0.14)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.18)",
  },
  modalExerciseNumberText: {
    color: "#E0F2FE",
    fontSize: 18,
    fontWeight: "800",
  },
  modalExerciseName: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  modalExerciseDescription: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 23,
  },
  detailCard: {
    gap: 8,
  },
  prescriptionCard: {
    gap: 12,
  },
  detailCardTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  detailCardText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  setTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 6,
  },
  setHeaderCell: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  setHeaderIndex: {
    flex: 0.7,
  },
  setTable: {
    gap: 10,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(8,15,31,0.68)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  setIndexPill: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56,189,248,0.14)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.16)",
  },
  setIndexText: {
    color: "#E0F2FE",
    fontSize: 13,
    fontWeight: "800",
  },
  setValueText: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
});
