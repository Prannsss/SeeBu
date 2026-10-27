/**
 * Centralized API Client
 * 
 * Provides consistent API request handling with:
 * - Automatic base URL configuration
 * - JWT token injection from cookies
 * - Standardized error handling
 * - Type-safe request/response handling
 */

export function resolveApiBaseUrl(): string {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envBaseUrl && envBaseUrl.trim()) {
    return envBaseUrl.replace(/\/$/, '');
  }

  // Development fallback — use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }

  // Production fallback — point to the Render backend
  return 'https://seebu.onrender.com';
}

/**
 * Get the auth token from cookies (server-side only)
 */
export async function getAuthToken(): Promise<string | undefined> {
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const reqCookies = await cookies();
    return reqCookies.get("auth-token")?.value;
  }
  return undefined;
}

/**
 * Build full API URL from path
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiBaseUrl()}${cleanPath}`;
}

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

function extractErrorMessage(error: any, response: Response): string {
  if (!error) return `HTTP ${response.status}: ${response.statusText}`;
  let baseMsg = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
  if (error.details && typeof error.details === 'object') {
    const detailKeys = Object.keys(error.details).filter(k => k !== '_errors');
    if (detailKeys.length > 0) {
      baseMsg += ` (${detailKeys.join(', ')})`;
    }
  }
  return baseMsg;
}

/**
 * Server-side API fetch with automatic auth
 */
export async function apiFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = true, headers = {}, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const token = await getAuthToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(apiUrl(path), {
    ...rest,
    headers: requestHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw Object.assign(new Error(extractErrorMessage(error, response)), { status: response.status });
  }

  return response.json();
}

/**
 * Client-side API fetch. Authenticated requests are routed through the
 * same-origin /api/proxy route handler, which reads the httpOnly auth-token
 * cookie server-side and forwards it as a Bearer header — client JS never
 * has direct access to the token.
 */
export async function apiFetchClient<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = true, headers = {}, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const proxiedApiPath = cleanPath.startsWith("api/v1/") ? cleanPath.slice("api/v1/".length) : cleanPath;
  const requestUrl = requireAuth ? `/api/proxy/${proxiedApiPath}` : apiUrl(path);

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...rest,
      headers: requestHeaders,
    });
  } catch (error: any) {
    throw new Error(`API network error (${error?.message || "request failed"}).`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw Object.assign(new Error(extractErrorMessage(error, response)), { status: response.status });
  }

  return response.json();
}

/** True when a client fetch failed at the network level behind a controlling SW (BackgroundSync queues it). */
export function isOfflineQueuedError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('API network error') && typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;
}

// ============================================================================
// Shared API object factory
// Eliminates the duplication between `api` (server) and `apiClient` (browser).
// Both objects expose identical method signatures — only the underlying fetcher differs.
// ============================================================================

type ApiFetcher = <T = any>(path: string, options?: FetchOptions) => Promise<T>;

/** Build a URLSearchParams string from a flat record, skipping undefined/empty values. */
function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.append(key, value);
  }
  return qs.toString();
}

export type AnalyticsRange = { from: string | null; to: string | null };

export type InviteRole = "superadmin" | "admin" | "workforce-admin" | "workforce";

export type InvitationRequest = {
  role: InviteRole;
  full_name: string;
  email: string;
  contact_number?: string;
  /** Workforce admins only: an existing department, or `new_department_name` to create one.
   *  Co-admins share the inviter's municipality; officers join the inviter's department. */
  department_id?: string | number;
  new_department_name?: string;
  /** Superadmins inviting an admin: the existing municipality they'll manage. */
  municipality_id?: string;
};

export type InvitationDetails = {
  status: "pending" | "accepted" | "declined" | "cancelled" | "replaced" | "revoked" | "expired";
  role: InviteRole;
  roleLabel: string;
  inviteeName: string;
  email: string;
  inviterName: string;
  /** "Cebu City" for admins; "General Maintenance, Cebu City" for department staff */
  placeName: string;
  expiresAt: string;
};

/** One row of a team's invitation history (admins: their municipality; workforce admins: their department). */
export type TeamInvitation = {
  id: string;
  role: InviteRole;
  roleLabel: string;
  name: string;
  email: string;
  department: string | null;
  /** Superadmins' list only: the admin's municipality. */
  municipality?: string | null;
  state: "pending" | "expired" | "accepted" | "declined" | "cancelled" | "replaced" | "revoked";
  /** Accepted only: "Pending Setup" until they choose their own password, then "Active". */
  accountStatus: string | null;
  invitedBy: string | null;
  invitedByYou: boolean;
  /** Only the sender may cancel / revoke / restore — or anyone on the team once the sender has left. */
  canManage: boolean;
  /** The viewer's own invitation (they can't revoke themselves). */
  isYou: boolean;
  createdAt: string;
  expiresAt: string;
  /** When the state last changed (answered, cancelled, replaced or revoked). */
  respondedAt: string | null;
};

function analyticsParams(barangayId?: string, range?: AnalyticsRange): URLSearchParams {
  return new URLSearchParams(buildQuery({
    barangay_id: barangayId && barangayId !== 'all' ? barangayId : undefined,
    from: range?.from ?? undefined,
    to: range?.to ?? undefined,
  }));
}

function buildApiObject(fetcher: ApiFetcher) {
  return {
    // Auth
    auth: {
      login: (email: string, password: string, role: string) =>
        fetcher("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password, role }), requireAuth: false }),
      register: (data: any) =>
        fetcher("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data), requireAuth: false }),
      provision: (data: any) =>
        fetcher("/api/v1/auth/provision", { method: "POST", body: JSON.stringify(data), requireAuth: true }),
      google: (data: any) =>
        fetcher("/api/v1/auth/google", { method: "POST", body: JSON.stringify(data), requireAuth: false }),
      facebook: (data: any) =>
        fetcher("/api/v1/auth/facebook", { method: "POST", body: JSON.stringify(data), requireAuth: false }),
      forgotPassword: (identifier: { email: string }) =>
        fetcher("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify(identifier), requireAuth: false }),
      verifyEmail: (email: string, code: string) =>
        fetcher("/api/v1/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }), requireAuth: false }),
      resendVerification: (email: string) =>
        fetcher("/api/v1/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }), requireAuth: false }),
      verifyResetCode: (email: string, code: string) =>
        fetcher("/api/v1/auth/verify-reset-code", { method: "POST", body: JSON.stringify({ email, code }), requireAuth: false }),
      resetPassword: (email: string, code: string, new_password: string) =>
        fetcher("/api/v1/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, new_password }), requireAuth: false }),
      // Invited staff, once, right after their first sign-in
      changePassword: (new_password: string) =>
        fetcher<{ data: { role: string; home: string } }>("/api/v1/auth/change-password", { method: "POST", body: JSON.stringify({ new_password }) }),
    },

    // Staff invitations (co-admins, workforce admins and officers)
    invitations: {
      list: () => fetcher<{ data: TeamInvitation[] }>("/api/v1/invitations"),
      create: (data: InvitationRequest) =>
        fetcher("/api/v1/invitations", { method: "POST", body: JSON.stringify(data) }),
      cancel: (id: string) => fetcher(`/api/v1/invitations/${encodeURIComponent(id)}/cancel`, { method: "POST" }),
      revoke: (id: string) => fetcher(`/api/v1/invitations/${encodeURIComponent(id)}/revoke`, { method: "POST" }),
      restore: (id: string) => fetcher(`/api/v1/invitations/${encodeURIComponent(id)}/restore`, { method: "POST" }),
      // The token in the emailed link is the credential, so these don't need a session.
      get: (token: string) =>
        fetcher<{ data: InvitationDetails }>(`/api/v1/invitations/${encodeURIComponent(token)}`, { requireAuth: false }),
      accept: (token: string) =>
        fetcher<{ data: { email: string } }>(`/api/v1/invitations/${encodeURIComponent(token)}/accept`, { method: "POST", requireAuth: false }),
      decline: (token: string) =>
        fetcher(`/api/v1/invitations/${encodeURIComponent(token)}/decline`, { method: "POST", requireAuth: false }),
    },

    // Users
    users: {
      me: () => fetcher("/api/v1/users/me"),
      updateMe: (data: any) =>
        fetcher("/api/v1/users/me", { method: "PATCH", body: JSON.stringify(data) }),
      getAll: () => fetcher("/api/v1/users"),
    },

    // Reports
    reports: {
      // page/page_size return one page plus `pagination`; count_statuses adds per-status `counts`.
      getAll: (params?: { municipality_id?: string; status?: string; urgency?: string; reporter_id?: string; reporter_email?: string; page?: number; page_size?: number; count_statuses?: string[] }) => {
        const query = buildQuery({
          municipality_id: params?.municipality_id,
          status: params?.status,
          urgency: params?.urgency,
          reporter_id: params?.reporter_id,
          reporter_email: params?.reporter_email,
          page: params?.page?.toString(),
          page_size: params?.page_size?.toString(),
          count_statuses: params?.count_statuses?.join(","),
        });
        return fetcher(`/api/v1/reports${query ? `?${query}` : ""}`);
      },
      getById: (id: string) => fetcher(`/api/v1/reports/${id}`),
      getByIdPublic: (id: string) => fetcher(`/api/v1/reports/${id}`, { requireAuth: false }),
      create: (data: any) =>
        fetcher("/api/v1/reports", { method: "POST", body: JSON.stringify(data), requireAuth: true }),
      update: (id: string, data: any) =>
        fetcher(`/api/v1/reports/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    },

    // Departments — include_personnel is boolean so it cannot use buildQuery directly
    departments: {
      getAll: (params?: { municipality_id?: string; include_personnel?: boolean }) => {
        const qs = new URLSearchParams();
        if (params?.municipality_id) qs.append("municipality_id", params.municipality_id);
        if (params?.include_personnel) qs.append("include_personnel", "true");
        const query = qs.toString();
        return fetcher(`/api/v1/departments${query ? `?${query}` : ""}`);
      },
      getPersonnel: (departmentId: string) => fetcher(`/api/v1/departments/${departmentId}/personnel`),
    },

    // Tasks
    tasks: {
      // tab = Pending | Assigned | Completed; count_tabs adds per-tab `counts`.
      getAll: (params?: { assigned_to?: string; delegated_to?: string; status?: string; tab?: string; page?: number; page_size?: number; count_tabs?: boolean }) => {
        const query = buildQuery({
          assigned_to: params?.assigned_to,
          delegated_to: params?.delegated_to,
          status: params?.status,
          tab: params?.tab,
          page: params?.page?.toString(),
          page_size: params?.page_size?.toString(),
          count_tabs: params?.count_tabs ? "true" : undefined,
        });
        return fetcher(`/api/v1/tasks${query ? `?${query}` : ""}`);
      },
      update: (id: string, data: any) =>
        fetcher(`/api/v1/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      complete: (id: string, data: { photo_urls?: string[]; photo_url?: string }) =>
        fetcher(`/api/v1/tasks/${id}/complete`, { method: "POST", body: JSON.stringify(data) }),
    },

    // Locations
    locations: {
      getAll: () => fetcher("/api/v1/locations"),
    },

    // Analytics — 'all' means no filter. `range` days are inclusive PH dates (YYYY-MM-DD).
    analytics: {
      superadmin: (municipalityId?: string, barangayId?: string, range?: AnalyticsRange) => {
        const params = analyticsParams(barangayId, range);
        if (municipalityId && municipalityId !== 'all') params.append('municipality_id', municipalityId);
        return fetcher(`/api/v1/analytics/superadmin?${params.toString()}`);
      },
      admin: (municipalityId: string, barangayId?: string, range?: AnalyticsRange) => {
        const params = analyticsParams(barangayId, range);
        return fetcher(`/api/v1/analytics/admin/${municipalityId}?${params.toString()}`);
      },
    },
  };
}

// ============================================================================
// Pre-configured API endpoints
// ============================================================================

/** Server-side API object (uses apiFetch — reads httpOnly cookies via next/headers) */
export const api = buildApiObject(apiFetch);

/** Client-side API object (uses apiFetchClient — routes auth through /api/proxy) */
export const apiClient = buildApiObject(apiFetchClient);

