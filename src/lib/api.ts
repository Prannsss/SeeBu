/**
 * Centralized API Client
 * 
 * Provides consistent API request handling with:
 * - Automatic base URL configuration
 * - JWT token injection from cookies
 * - Standardized error handling
 * - Type-safe request/response handling
 */

function resolveApiBaseUrl(): string {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envBaseUrl && envBaseUrl.trim()) {
    return envBaseUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    // Use the current hostname to avoid forcing localhost in browser environments.
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return "http://localhost:5000";
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
 * Get the auth token from cookies (client-side)
 */
export function getAuthTokenClient(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
  return match?.[1];
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
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Client-side API fetch with automatic auth
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

  if (requireAuth) {
    const token = getAuthTokenClient();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const requestUrl = apiUrl(path);
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...rest,
      headers: requestHeaders,
    });
  } catch (error: any) {
    throw new Error(`API network error. Check backend availability at ${resolveApiBaseUrl()} (${error?.message || "request failed"}).`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Pre-configured API endpoints
// ============================================================================

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string, role: string) =>
      apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
        requireAuth: false,
      }),
    register: (data: any) =>
      apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        requireAuth: false,
      }),
    provision: (data: any) =>
      apiFetch("/api/v1/auth/provision", {
        method: "POST",
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    google: (data: any) =>
      apiFetch("/api/v1/auth/google", {
        method: "POST",
        body: JSON.stringify(data),
        requireAuth: false,
      }),
    facebook: (data: any) =>
      apiFetch("/api/v1/auth/facebook", {
        method: "POST",
        body: JSON.stringify(data),
        requireAuth: false,
      }),
  },

  // Users
  users: {
    me: () => apiFetch("/api/v1/users/me"),
    updateMe: (data: any) =>
      apiFetch("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    getAll: () => apiFetch("/api/v1/users"),
  },

  // Reports
  reports: {
    getAll: (params?: { municipality_id?: string; status?: string; reporter_id?: string; reporter_email?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.municipality_id) queryParams.append("municipality_id", params.municipality_id);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.reporter_id) queryParams.append("reporter_id", params.reporter_id);
      if (params?.reporter_email) queryParams.append("reporter_email", params.reporter_email);
      const query = queryParams.toString();
      return apiFetch(`/api/v1/reports${query ? `?${query}` : ""}`);
    },
    getById: (id: string) => apiFetch(`/api/v1/reports/${id}`),
    getByIdPublic: (id: string) =>
      apiFetch(`/api/v1/reports/${id}`, {
        requireAuth: false,
      }),
    create: (data: any) =>
      apiFetch("/api/v1/reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiFetch(`/api/v1/reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Departments
  departments: {
    getAll: (params?: { municipality_id?: string; include_personnel?: boolean }) => {
      const queryParams = new URLSearchParams();
      if (params?.municipality_id) queryParams.append("municipality_id", params.municipality_id);
      if (params?.include_personnel) queryParams.append("include_personnel", "true");
      const query = queryParams.toString();
      return apiFetch(`/api/v1/departments${query ? `?${query}` : ""}`);
    },
    getPersonnel: (departmentId: string) => apiFetch(`/api/v1/departments/${departmentId}/personnel`),
  },

  // Tasks
  tasks: {
    getAll: (params?: { assigned_to?: string; delegated_to?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.assigned_to) queryParams.append("assigned_to", params.assigned_to);
      if (params?.delegated_to) queryParams.append("delegated_to", params.delegated_to);
      if (params?.status) queryParams.append("status", params.status);
      const query = queryParams.toString();
      return apiFetch(`/api/v1/tasks${query ? `?${query}` : ""}`);
    },
    update: (id: string, data: any) =>
      apiFetch(`/api/v1/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    complete: (id: string, data: { photo_urls?: string[]; photo_url?: string }) =>
      apiFetch(`/api/v1/tasks/${id}/complete`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Locations
  locations: {
    getAll: () => apiFetch("/api/v1/locations"),
  },

  // Analytics
  analytics: {
    superadmin: () => apiFetch("/api/v1/analytics/superadmin"),
    admin: (municipalityId: string) =>
      apiFetch(`/api/v1/analytics/admin/${municipalityId}`),
  },
};

// ============================================================================
// Client-side API (for use in "use client" components)
// ============================================================================

export const apiClient = {
  // Auth
  auth: {
    login: (email: string, password: string, role: string) =>
      apiFetchClient("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
        requireAuth: false,
      }),
    register: (data: any) =>
      apiFetchClient("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        requireAuth: false,
      }),
    provision: (data: any) =>
      apiFetchClient("/api/v1/auth/provision", {
        method: "POST",
        body: JSON.stringify(data),
        requireAuth: true,
      }),
    google: (data: any) =>
      apiFetchClient("/api/v1/auth/google", {
        method: "POST",
        body: JSON.stringify(data),
        requireAuth: false,
      }),
    facebook: (data: any) =>
      apiFetchClient("/api/v1/auth/facebook", {
        method: "POST",
        body: JSON.stringify(data),
        requireAuth: false,
      }),
  },

  // Users
  users: {
    me: () => apiFetchClient("/api/v1/users/me"),
    updateMe: (data: any) =>
      apiFetchClient("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    getAll: () => apiFetchClient("/api/v1/users"),
  },

  // Reports
  reports: {
    getAll: (params?: { municipality_id?: string; status?: string; reporter_id?: string; reporter_email?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.municipality_id) queryParams.append("municipality_id", params.municipality_id);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.reporter_id) queryParams.append("reporter_id", params.reporter_id);
      if (params?.reporter_email) queryParams.append("reporter_email", params.reporter_email);
      const query = queryParams.toString();
      return apiFetchClient(`/api/v1/reports${query ? `?${query}` : ""}`);
    },
    getById: (id: string) => apiFetchClient(`/api/v1/reports/${id}`),
    getByIdPublic: (id: string) =>
      apiFetchClient(`/api/v1/reports/${id}`, {
        requireAuth: false,
      }),
    create: (data: any) =>
      apiFetchClient("/api/v1/reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiFetchClient(`/api/v1/reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Departments
  departments: {
    getAll: (params?: { municipality_id?: string; include_personnel?: boolean }) => {
      const queryParams = new URLSearchParams();
      if (params?.municipality_id) queryParams.append("municipality_id", params.municipality_id);
      if (params?.include_personnel) queryParams.append("include_personnel", "true");
      const query = queryParams.toString();
      return apiFetchClient(`/api/v1/departments${query ? `?${query}` : ""}`);
    },
    getPersonnel: (departmentId: string) => apiFetchClient(`/api/v1/departments/${departmentId}/personnel`),
  },

  // Tasks
  tasks: {
    getAll: (params?: { assigned_to?: string; delegated_to?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.assigned_to) queryParams.append("assigned_to", params.assigned_to);
      if (params?.delegated_to) queryParams.append("delegated_to", params.delegated_to);
      if (params?.status) queryParams.append("status", params.status);
      const query = queryParams.toString();
      return apiFetchClient(`/api/v1/tasks${query ? `?${query}` : ""}`);
    },
    update: (id: string, data: any) =>
      apiFetchClient(`/api/v1/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    complete: (id: string, data: { photo_urls?: string[]; photo_url?: string }) =>
      apiFetchClient(`/api/v1/tasks/${id}/complete`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Locations
  locations: {
    getAll: () => apiFetchClient("/api/v1/locations"),
  },

  // Analytics
  analytics: {
    superadmin: () => apiFetchClient("/api/v1/analytics/superadmin"),
    admin: (municipalityId: string) =>
      apiFetchClient(`/api/v1/analytics/admin/${municipalityId}`),
  },
};
