import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ClientMeResponse,
  MobileClientInviteDetailsResponse,
} from "@trenova/contracts";
import { ApiClientError } from "@trenova/api-client";
import { apiClient, setApiAccessToken } from "@/src/lib/api";
import { resetMobileAblyClient } from "@/src/lib/realtime";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "@/src/lib/auth-storage";

type AuthStatus = "bootstrapping" | "guest" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  accessToken: string | null;
  me: ClientMeResponse | null;
  error: string | null;
  signIn: (input: { email: string; password: string }) => Promise<boolean>;
  registerWithInvite: (input: {
    fullName: string;
    email: string;
    password: string;
    inviteToken: string;
  }) => Promise<boolean>;
  acceptInvite: (token: string) => Promise<boolean>;
  previewInvite: (token: string) => Promise<MobileClientInviteDetailsResponse>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const BOOTSTRAP_MIN_DURATION_MS = 900;

function getErrorMessage(error: unknown) {
  const message =
    error instanceof ApiClientError || error instanceof Error
      ? error.message
      : null;

  switch (message) {
    case "INVALID_CREDENTIALS":
      return "Email o password non valide.";
    case "EMAIL_ALREADY_USED":
      return "Questa email risulta gia registrata.";
    case "INVITE_NOT_FOUND":
      return "Invito non trovato.";
    case "INVITE_REVOKED":
      return "Questo invito e stato revocato.";
    case "INVITE_ALREADY_USED":
      return "Questo invito e gia stato utilizzato.";
    case "INVITE_EXPIRED":
      return "Questo invito e scaduto.";
    case "INVITE_EMAIL_MISMATCH":
      return "Usa la stessa email indicata nell'invito.";
    case "USER_ALREADY_IN_OTHER_TENANT":
      return "Il tuo account e gia collegato a un altro coach.";
    case "INVALID_PAYLOAD":
      return "Controlla i dati inseriti e riprova.";
    case "SLOT_NOT_FOUND":
      return "Questo slot non e piu disponibile.";
    case "SLOT_NOT_AVAILABLE":
      return "Lo slot scelto non e piu prenotabile.";
    case "SLOT_ALREADY_BOOKED":
      return "Qualcuno ha gia prenotato questo slot.";
    case "CLIENT_ALREADY_BOOKED":
      return "Hai gia una sessione in questo intervallo orario.";
    case "UNAUTHORIZED":
      return "Devi prima accedere con un account cliente.";
    case "FORBIDDEN":
      return "Questo account non puo accedere all'app cliente.";
    default:
      break;
  }

  if (error instanceof ApiClientError) {
    return "Non siamo riusciti a completare l'operazione.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Si e verificato un errore imprevisto.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("bootstrapping");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [me, setMe] = useState<ClientMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);

  const applyAuthenticatedSession = useCallback(
    async (nextAccessToken: string) => {
      setApiAccessToken(nextAccessToken);

      const nextMe = await apiClient.getClientMe();

      await setStoredAccessToken(nextAccessToken);

      setAccessToken(nextAccessToken);
      setMe(nextMe);
      setStatus("authenticated");
      setError(null);
    },
    []
  );

  const clearSession = useCallback(async () => {
    setApiAccessToken(null);
    resetMobileAblyClient();
    await clearStoredAccessToken();
    setAccessToken(null);
    setMe(null);
    setStatus("guest");
  }, []);

  const refreshSession = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setApiAccessToken(accessToken);

    try {
      const nextMe = await apiClient.getClientMe();
      setMe(nextMe);
      setStatus("authenticated");
      setError(null);
    } catch (nextError) {
      await clearSession();
      setError(getErrorMessage(nextError));
    }
  }, [accessToken, clearSession]);

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    try {
      const session = await apiClient.signInClientWithPassword(input);
      await applyAuthenticatedSession(session.accessToken);
      return true;
    } catch (nextError) {
      await clearSession();
      setError(getErrorMessage(nextError));
      return false;
    }
  }, [applyAuthenticatedSession, clearSession]);

  const registerWithInvite = useCallback(
    async (input: {
      fullName: string;
      email: string;
      password: string;
      inviteToken: string;
    }) => {
      try {
        const session = await apiClient.signUpClientWithInvite(input);
        await applyAuthenticatedSession(session.accessToken);
        return true;
      } catch (nextError) {
        setError(getErrorMessage(nextError));
        return false;
      }
    },
    [applyAuthenticatedSession]
  );

  const acceptInvite = useCallback(async (token: string) => {
    try {
      const result = await apiClient.acceptClientInvite(token);

      if (!result.ok) {
        setError(getErrorMessage(new Error(result.error)));
        return false;
      }

      await applyAuthenticatedSession(result.session.accessToken);
      return true;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      return false;
    }
  }, [applyAuthenticatedSession]);

  const previewInvite = useCallback(async (token: string) => {
    try {
      return await apiClient.getClientInvite(token);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      return {
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      } satisfies MobileClientInviteDetailsResponse;
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setError(null);
  }, [clearSession]);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }

    bootstrappedRef.current = true;

    let cancelled = false;
    const bootstrapStartedAt = Date.now();

    async function bootstrap() {
      try {
        const storedAccessToken = await getStoredAccessToken();

        if (!storedAccessToken) {
          if (!cancelled) {
            setStatus("guest");
          }
          return;
        }

        setApiAccessToken(storedAccessToken);

        const nextMe = await apiClient.getClientMe();

        if (!cancelled) {
          setAccessToken(storedAccessToken);
          setMe(nextMe);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          await clearSession();
        }
      } finally {
        const elapsed = Date.now() - bootstrapStartedAt;
        const remaining = Math.max(0, BOOTSTRAP_MIN_DURATION_MS - elapsed);

        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (!cancelled) {
          setStatus((currentStatus) =>
            currentStatus === "bootstrapping" ? "guest" : currentStatus
          );
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        accessToken,
        me,
        error,
        signIn,
        registerWithInvite,
        acceptInvite,
        previewInvite,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
