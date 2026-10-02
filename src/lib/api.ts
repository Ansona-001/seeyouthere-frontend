// Client for the Go API. The browser calls it directly with the session cookie;
// server components go through lib/server-api.ts instead.

export * from "./api-types";
import type { ApiErrorBody, ApiErrorDetails, MfaStatus } from "./api-types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type User = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  created_at: string;
  /** Only present when `roles` is non-empty (§4.9). */
  mfa?: MfaStatus;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ApiErrorDetails,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? "unknown",
      body?.error?.message ?? "Something went wrong. Please try again.",
      body?.error?.details,
    );
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
