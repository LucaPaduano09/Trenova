import {
  clientDashboardResponseSchema,
  clientMeResponseSchema,
  clientSessionBookingResponseSchema,
  clientSessionsResponseSchema,
  clientWorkoutsResponseSchema,
  mobilePushRegistrationResponseSchema,
  mobileClientAcceptInviteResponseSchema,
  mobileClientAuthSessionSchema,
  mobileClientInviteDetailsResponseSchema,
  type ClientDashboardResponse,
  type ClientMeResponse,
  type ClientSessionBookingResponse,
  type ClientSessionsResponse,
  type ClientWorkoutsResponse,
  type MobilePushRegistrationResponse,
  type MobileClientAcceptInviteResponse,
  type MobileClientAuthSession,
  type MobileClientInviteDetailsResponse,
} from "@trenova/contracts";
import { ZodType } from "zod";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

type CreateApiClientOptions = {
  baseUrl: string;
  fetcher?: typeof fetch;
  headers?: HeadersInit;
  getAccessToken?: (() => string | null | Promise<string | null>) | undefined;
};

async function parseJsonResponse<T>(
  response: Response,
  schema: ZodType<T>
): Promise<T> {
  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (
      parsedBody &&
      typeof parsedBody === "object" &&
      "error" in parsedBody &&
      typeof parsedBody.error === "string"
    ) {
      message = parsedBody.error;
    } else if (rawBody.trim().startsWith("<")) {
      message = "Server returned HTML instead of JSON";
    } else if (rawBody.trim()) {
      message = rawBody.trim().slice(0, 160);
    }

    throw new ApiClientError(message, response.status);
  }

  if (parsedBody === null) {
    throw new ApiClientError("Server returned invalid JSON", response.status);
  }

  return schema.parse(parsedBody);
}

export function createTrenovaApiClient(options: CreateApiClientOptions) {
  const fetcher = options.fetcher ?? fetch;
  const normalizedBaseUrl = options.baseUrl.replace(/\/+$/, "");

  async function request<T>(
    path: string,
    init: RequestInit,
    schema: ZodType<T>
  ): Promise<T> {
    const accessToken = await options.getAccessToken?.();

    const response = await fetcher(`${normalizedBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
        ...init.headers,
      },
      credentials: "include",
    });

    return parseJsonResponse(response, schema);
  }

  async function get<T>(path: string, schema: ZodType<T>): Promise<T> {
    return request(
      path,
      {
        method: "GET",
      },
      schema
    );
  }

  async function post<TResponse, TInput>(
    path: string,
    body: TInput,
    schema: ZodType<TResponse>
  ): Promise<TResponse> {
    return request(
      path,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      schema
    );
  }

  return {
    getClientMe(): Promise<ClientMeResponse> {
      return get("/api/mobile/client/me", clientMeResponseSchema);
    },
    getClientDashboard(): Promise<ClientDashboardResponse> {
      return get("/api/mobile/client/dashboard", clientDashboardResponseSchema);
    },
    getClientSessions(month?: string): Promise<ClientSessionsResponse> {
      const search = month
        ? `?month=${encodeURIComponent(month)}`
        : "";
      return get(
        `/api/mobile/client/sessions${search}`,
        clientSessionsResponseSchema
      );
    },
    bookClientSession(input: {
      slotKey: string;
    }): Promise<ClientSessionBookingResponse> {
      return post(
        "/api/mobile/client/sessions/book",
        input,
        clientSessionBookingResponseSchema
      );
    },
    registerMobilePushDevice(input: {
      expoPushToken: string;
      platform: string;
      deviceName?: string | null;
      appOwnership?: string | null;
    }): Promise<MobilePushRegistrationResponse> {
      return post(
        "/api/mobile/client/push/register",
        input,
        mobilePushRegistrationResponseSchema
      );
    },
    getClientWorkouts(): Promise<ClientWorkoutsResponse> {
      return get("/api/mobile/client/workouts", clientWorkoutsResponseSchema);
    },
    signInClientWithPassword(input: {
      email: string;
      password: string;
    }): Promise<MobileClientAuthSession> {
      return post(
        "/api/mobile/client/auth/login",
        input,
        mobileClientAuthSessionSchema
      );
    },
    signUpClientWithInvite(input: {
      fullName: string;
      email: string;
      password: string;
      inviteToken: string;
    }): Promise<MobileClientAuthSession> {
      return post(
        "/api/mobile/client/auth/register-invite",
        input,
        mobileClientAuthSessionSchema
      );
    },
    getClientInvite(token: string): Promise<MobileClientInviteDetailsResponse> {
      return get(
        `/api/mobile/client/invites/${encodeURIComponent(token)}`,
        mobileClientInviteDetailsResponseSchema
      );
    },
    acceptClientInvite(token: string): Promise<MobileClientAcceptInviteResponse> {
      return request(
        `/api/mobile/client/invites/${encodeURIComponent(token)}/accept`,
        {
          method: "POST",
        },
        mobileClientAcceptInviteResponseSchema
      );
    },
  };
}
