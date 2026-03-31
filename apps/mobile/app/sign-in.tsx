import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "@/src/components/BrandMark";
import { LaunchScreen } from "@/src/components/LaunchScreen";
import { Reveal } from "@/src/components/Reveal";
import { SurfaceCard } from "@/src/components/SurfaceCard";
import { useAuth } from "@/src/providers/AuthProvider";

type AuthMode = "login" | "register";

function getInviteErrorText(error?: string) {
  switch (error) {
    case "INVITE_NOT_FOUND":
      return "Non abbiamo trovato un invito con questo codice.";
    case "INVITE_REVOKED":
      return "Questo invito e stato revocato dal coach.";
    case "INVITE_ALREADY_USED":
      return "Questo invito risulta gia utilizzato.";
    case "INVITE_EXPIRED":
      return "Questo invito e scaduto.";
    default:
      return "Non siamo riusciti a validare l'invito.";
  }
}

function normalizeInviteToken(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const inviteMatch = trimmed.match(/\/invite\/([^/?#]+)/i);

  if (inviteMatch?.[1]) {
    return inviteMatch[1];
  }

  const customSchemeMatch = trimmed.match(/invite\/([^/?#]+)/i);

  if (customSchemeMatch?.[1]) {
    return customSchemeMatch[1];
  }

  return trimmed;
}

export default function SignInScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    inviteToken?: string;
  }>();
  const router = useRouter();
  const { status, error, signIn, registerWithInvite, previewInvite } = useAuth();

  const initialMode: AuthMode =
    params.mode === "register" ? "register" : "login";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteToken, setInviteToken] = useState(
    normalizeInviteToken(
      typeof params.inviteToken === "string" ? params.inviteToken : ""
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [inviteSummary, setInviteSummary] = useState<Awaited<
    ReturnType<typeof previewInvite>
  > | null>(null);

  const canSubmitLogin = useMemo(() => {
    return email.trim().includes("@") && password.length > 0 && !submitting;
  }, [email, password, submitting]);

  const canSubmitInviteRegistration = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().includes("@") &&
      password.length >= 8 &&
      inviteToken.trim().length > 0 &&
      !submitting
    );
  }, [email, fullName, inviteToken, password, submitting]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const nextToken = normalizeInviteToken(
      typeof params.inviteToken === "string" ? params.inviteToken : inviteToken
    );

    if (!nextToken || mode !== "register") {
      return;
    }

    let cancelled = false;

    async function loadInvite() {
      setInviteLoading(true);
      const result = await previewInvite(nextToken);

      if (cancelled) {
        return;
      }

      setInviteSummary(result);

      if (result.ok && result.invite.email) {
        setEmail(result.invite.email);
      }

      setInviteLoading(false);
    }

    void loadInvite();

    return () => {
      cancelled = true;
    };
  }, [inviteToken, mode, params.inviteToken, previewInvite]);

  if (status === "bootstrapping") {
    return <LaunchScreen subtitle="Stiamo preparando l'accesso cliente." />;
  }

  if (status === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  async function handleLogin() {
    setSubmitting(true);
    setLocalError(null);

    const ok = await signIn({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (ok) {
      router.replace("/(tabs)");
      return;
    }

    setLocalError("Non siamo riusciti ad accedere con queste credenziali.");
  }

  async function handleRegisterWithInvite() {
    const normalizedToken = normalizeInviteToken(inviteToken);

    setSubmitting(true);
    setLocalError(null);

    const ok = await registerWithInvite({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      inviteToken: normalizedToken,
    });

    setSubmitting(false);

    if (ok) {
      router.replace("/(tabs)");
      return;
    }

    setLocalError("Controlla l'invito e i dati inseriti, poi riprova.");
  }

  const visibleError = error ?? localError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Reveal delay={60}>
            <View style={styles.heroShell}>
              <View style={styles.heroGlowA} />
              <View style={styles.heroGlowB} />
              <View style={styles.heroOrbit} />
              <BrandMark size="lg" />
              <Text style={styles.eyebrow}>Client Experience</Text>
              <Text style={styles.title}>Accedi al tuo spazio benessere</Text>
              <Text style={styles.subtitle}>
                Un ambiente elegante per seguire il percorso con il tuo coach,
                controllare sessioni, workout e progressi senza attrito.
              </Text>

              <View style={styles.featureRow}>
                <FeaturePill label="Sessioni live" />
                <FeaturePill label="Workout attivi" />
                <FeaturePill label="Progressi" />
              </View>
            </View>
          </Reveal>

          <Reveal delay={180}>
            <SurfaceCard style={styles.authShell}>
            <View style={styles.toggle}>
              <Pressable
                style={[
                  styles.toggleButton,
                  mode === "login" && styles.toggleButtonActive,
                ]}
                onPress={() => setMode("login")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    mode === "login" && styles.toggleTextActive,
                  ]}
                >
                  Accedi
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.toggleButton,
                  mode === "register" && styles.toggleButtonActive,
                ]}
                onPress={() => setMode("register")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    mode === "register" && styles.toggleTextActive,
                  ]}
                >
                  Invito
                </Text>
              </Pressable>
            </View>

            {mode === "login" ? (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.cardTitle}>Bentornato</Text>
                  <Text style={styles.cardText}>
                    Entra con il tuo account cliente per aprire la dashboard
                    personale Trenova.
                  </Text>
                </View>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Email"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Password"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />

                {visibleError ? (
                  <Text style={styles.errorText}>{visibleError}</Text>
                ) : null}

                <Pressable
                  style={[
                    styles.primaryButton,
                    !canSubmitLogin && styles.buttonDisabled,
                  ]}
                  onPress={() => void handleLogin()}
                  disabled={!canSubmitLogin}
                >
                  <Text style={styles.primaryButtonText}>
                    {submitting ? "Accesso in corso..." : "Apri la tua home"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.cardTitle}>Registrazione premium</Text>
                  <Text style={styles.cardText}>
                    Incolla il link o il codice ricevuto dal tuo personal trainer
                    per collegarti subito al workspace corretto.
                  </Text>
                </View>

                <TextInput
                  value={inviteToken}
                  onChangeText={(value) => {
                    setInviteToken(value);
                    setInviteSummary(null);
                  }}
                  autoCapitalize="none"
                  placeholder="Link o token invito"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />

                {inviteLoading ? (
                  <Text style={styles.helperText}>Verifica invito in corso...</Text>
                ) : inviteSummary?.ok ? (
                  <View style={styles.inviteSummary}>
                    <Text style={styles.inviteSummaryTitle}>
                      {inviteSummary.invite.trainer?.fullName ??
                        inviteSummary.invite.workspace.name}
                    </Text>
                    <Text style={styles.inviteSummaryText}>
                      Workspace: {inviteSummary.invite.workspace.name}
                    </Text>
                    {inviteSummary.invite.email ? (
                      <Text style={styles.inviteSummaryText}>
                        Email invitata: {inviteSummary.invite.email}
                      </Text>
                    ) : null}
                  </View>
                ) : inviteSummary?.ok === false ? (
                  <Text style={styles.errorText}>
                    {getInviteErrorText(inviteSummary.error)}
                  </Text>
                ) : (
                  <Text style={styles.helperText}>
                    Se hai ricevuto un link completo, puoi incollarlo qui
                    direttamente.
                  </Text>
                )}

                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nome completo"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Email"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Password"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />

                <Text style={styles.helperText}>
                  Password minima: 8 caratteri.
                </Text>

                {visibleError ? (
                  <Text style={styles.errorText}>{visibleError}</Text>
                ) : null}

                <Pressable
                  style={[
                    styles.primaryButton,
                    !canSubmitInviteRegistration && styles.buttonDisabled,
                  ]}
                  onPress={() => void handleRegisterWithInvite()}
                  disabled={!canSubmitInviteRegistration}
                >
                  <Text style={styles.primaryButtonText}>
                    {submitting ? "Creazione account..." : "Crea il tuo accesso"}
                  </Text>
                </Pressable>
              </View>
            )}
            </SurfaceCard>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <View style={styles.featurePill}>
      <Text style={styles.featurePillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09111F",
  },
  keyboard: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 18,
  },
  heroShell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0F172A",
    padding: 22,
    gap: 14,
  },
  heroGlowA: {
    position: "absolute",
    top: -28,
    right: -8,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.18)",
  },
  heroGlowB: {
    position: "absolute",
    bottom: -42,
    left: -18,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.16)",
  },
  heroOrbit: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 92,
    height: 92,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  eyebrow: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.9,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 39,
    maxWidth: 300,
  },
  subtitle: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 330,
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featurePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featurePillText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
  },
  authShell: {
    padding: 14,
    borderRadius: 30,
    backgroundColor: "rgba(15,23,42,0.72)",
  },
  toggle: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 4,
    backgroundColor: "rgba(8,15,31,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  toggleButtonActive: {
    backgroundColor: "#F8FAFC",
  },
  toggleText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  toggleTextActive: {
    color: "#0B1324",
  },
  card: {
    gap: 14,
    paddingTop: 16,
  },
  sectionHeader: {
    gap: 6,
    marginBottom: 2,
  },
  cardTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  cardText: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(8,15,31,0.82)",
    color: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  helperText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  inviteSummary: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.22)",
    backgroundColor: "rgba(16,185,129,0.10)",
    padding: 15,
    gap: 6,
  },
  inviteSummaryTitle: {
    color: "#ECFDF5",
    fontSize: 16,
    fontWeight: "800",
  },
  inviteSummaryText: {
    color: "#A7F3D0",
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#34D399",
    paddingVertical: 16,
    shadowColor: "#02130F",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#042F2E",
    fontSize: 15,
    fontWeight: "800",
  },
});
