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
    throw new Error(extractErrorMessage(error, response));
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
    throw new Error(extractErrorMessage(error, response));
  }

  return response.json();
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
      forgotPassword: (identifier: { email: string; channel?: "email" } | { contact_number: string; channel: "sms" }) =>
        fetcher("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify(identifier), requireAuth: false }),
      verifyEmail: (email: string, code: string) =>
        fetcher("/api/v1/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }), requireAuth: false }),
      resendVerification: (email: string) =>
        fetcher("/api/v1/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }), requireAuth: false }),
      verifyResetCode: (email: string, code: string) =>
        fetcher("/api/v1/auth/verify-reset-code", { method: "POST", body: JSON.stringify({ email, code }), requireAuth: false }),
      resetPassword: (email: string, code: string, new_password: string) =>
        fetcher("/api/v1/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, new_password }), requireAuth: false }),
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
      getAll: (params?: { municipality_id?: string; status?: string; reporter_id?: string; reporter_email?: string }) => {
        const query = buildQuery({
          municipality_id: params?.municipality_id,
          status: params?.status,
          reporter_id: params?.reporter_id,
          reporter_email: params?.reporter_email,
        });
        return fetcher(`/api/v1/reports${query ? `?${query}` : ""}`);
      },
      getById: (id: string) => fetcher(`/api/v1/reports/${id}`),
      getByIdPublic: (id: string) => fetcher(`/api/v1/reports/${id}`, { requireAuth: false }),
      create: (data: any) =>
        fetcher("/api/v1/reports", { method: "POST", body: JSON.stringify(data), requireAuth: false }),
      scanImage: (data: { photo: string }) =>
        fetcher("/api/v1/reports/scan-image", { method: "POST", body: JSON.stringify(data), requireAuth: false }),
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
      getAll: (params?: { assigned_to?: string; delegated_to?: string; status?: string }) => {
        const query = buildQuery({
          assigned_to: params?.assigned_to,
          delegated_to: params?.delegated_to,
          status: params?.status,
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

    // Analytics — uses 'all' sentinel check, so buildQuery is not used here
    analytics: {
      superadmin: (municipalityId?: string, barangayId?: string) => {
        const params = new URLSearchParams();
        if (municipalityId && municipalityId !== 'all') params.append('municipality_id', municipalityId);
        if (barangayId && barangayId !== 'all') params.append('barangay_id', barangayId);
        return fetcher(`/api/v1/analytics/superadmin?${params.toString()}`);
      },
      admin: (municipalityId: string, barangayId?: string) => {
        const params = new URLSearchParams();
        if (barangayId && barangayId !== 'all') params.append('barangay_id', barangayId);
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

