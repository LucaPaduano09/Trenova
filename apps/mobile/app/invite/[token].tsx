import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MobileClientInviteDetailsResponse } from "@trenova/contracts";
import { LaunchScreen } from "@/src/components/LaunchScreen";
import { SurfaceCard } from "@/src/components/SurfaceCard";
import { useAuth } from "@/src/providers/AuthProvider";

function getInviteErrorText(error?: string) {
  switch (error) {
    case "INVITE_NOT_FOUND":
      return "Questo invito non esiste piu.";
    case "INVITE_REVOKED":
      return "Questo invito e stato revocato dal coach.";
    case "INVITE_ALREADY_USED":
      return "Questo invito risulta gia utilizzato.";
    case "INVITE_EXPIRED":
      return "Questo invito e scaduto.";
    default:
      return "Questo invito non e disponibile al momento.";
  }
}

export default function InviteTokenScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const { status, previewInvite, acceptInvite, error } = useAuth();
  const token = typeof params.token === "string" ? params.token : "";
  const [invite, setInvite] = useState<MobileClientInviteDetailsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadInvite() {
      const result = await previewInvite(token);

      if (!cancelled) {
        setInvite(result);
        setLoading(false);
      }
    }

    void loadInvite();

    return () => {
      cancelled = true;
    };
  }, [previewInvite, token]);

  if (status === "bootstrapping") {
    return <LaunchScreen subtitle="Stiamo controllando il tuo invito." />;
  }

  if (!token) {
    return <Redirect href="/sign-in?mode=register" />;
  }

  async function handleAcceptInvite() {
    setAccepting(true);
    const ok = await acceptInvite(token);
    setAccepting(false);

    if (ok) {
      router.replace("/(tabs)");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SurfaceCard style={styles.card}>
          <Text style={styles.eyebrow}>Trenova Invite</Text>
          <Text style={styles.title}>Collega il tuo account al coach</Text>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#34D399" />
              <Text style={styles.helperText}>Carichiamo i dettagli dell'invito...</Text>
            </View>
          ) : invite?.ok ? (
            <>
              <Text style={styles.bodyText}>
                Ti stai collegando a{" "}
                {invite.invite.trainer?.fullName ?? invite.invite.workspace.name}.
              </Text>

              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>{invite.invite.workspace.name}</Text>
                {invite.invite.trainer?.email ? (
                  <Text style={styles.summaryText}>
                    Coach: {invite.invite.trainer.email}
                  </Text>
                ) : null}
                {invite.invite.email ? (
                  <Text style={styles.summaryText}>
                    Email invitata: {invite.invite.email}
                  </Text>
                ) : null}
              </View>

              {status === "authenticated" ? (
                <Pressable
                  style={[styles.primaryButton, accepting && styles.buttonDisabled]}
                  onPress={() => void handleAcceptInvite()}
                  disabled={accepting}
                >
                  <Text style={styles.primaryButtonText}>
                    {accepting ? "Associazione in corso..." : "Accetta invito"}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.actions}>
                  <Link
                    href={{
                      pathname: "/sign-in",
                      params: { mode: "login" },
                    }}
                    asChild
                  >
                    <Pressable style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Ho gia un account</Text>
                    </Pressable>
                  </Link>
                  <Link
                    href={{
                      pathname: "/sign-in",
                      params: { mode: "register", inviteToken: token },
                    }}
                    asChild
                  >
                    <Pressable style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>Registrati con invito</Text>
                    </Pressable>
                  </Link>
                </View>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.errorText}>
                {getInviteErrorText(invite?.ok === false ? invite.error : undefined)}
              </Text>
              <Link href="/sign-in?mode=register" asChild>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Torna all'accesso</Text>
                </Pressable>
              </Link>
            </>
          )}
        </SurfaceCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1324",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    gap: 16,
  },
  eyebrow: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  bodyText: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
  },
  centerState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  helperText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  summary: {
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(8,15,31,0.7)",
    padding: 14,
  },
  summaryTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryText: {
    color: "#CBD5E1",
    fontSize: 14,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#34D399",
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: "#042F2E",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    lineHeight: 20,
  },
});
