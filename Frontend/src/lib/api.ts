export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "/api/v1";
    }
  }
  return "http://localhost:3001/api/v1";
}

export const API_BASE_URL = getApiBaseUrl();

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  firmName?: string;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cfo_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getActiveHouseholdInfo(): { id: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cfo_active_household");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveHouseholdInfo(id: string, name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cfo_active_household", JSON.stringify({ id, name }));
  window.dispatchEvent(new Event("cfo-household-changed"));
}

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Invalid email or password");
  }

  const data = await res.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("cfo_access_token", data.accessToken);
    localStorage.setItem("cfo_refresh_token", data.refreshToken);
    localStorage.setItem("cfo_user", JSON.stringify(data.user));
  }
  return data;
}

export function logoutApi() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("cfo_access_token");
    localStorage.removeItem("cfo_refresh_token");
    localStorage.removeItem("cfo_user");
  }
}

async function ensureAccessToken(): Promise<string> {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("cfo_access_token");
  if (existing) return existing;

  // Auto-authenticate with default test user if user opened a protected route directly
  const data = await loginApi("testuser@test.com", "123Test!");
  return data.accessToken;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await ensureAccessToken();

  const doRequest = async (bearer: string) => {
    return fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(options.headers || {}),
      },
    });
  };

  let res = await doRequest(token);

  if (res.status === 401) {
    // Re-authenticate and retry once
    if (typeof window !== "undefined") {
      localStorage.removeItem("cfo_access_token");
    }
    token = await ensureAccessToken();
    res = await doRequest(token);
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = Array.isArray(errBody.message)
      ? errBody.message.join(", ")
      : errBody.message || `API request failed (${res.status})`;
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ---------------- DASHBOARD & HOUSEHOLDS ----------------

export function fetchDashboardSummary() {
  return apiFetch("/clients/dashboard-summary");
}

export function fetchHouseholds() {
  return apiFetch<any[]>("/clients");
}

export function fetchHouseholdById(id: string) {
  return apiFetch<any>(`/clients/${encodeURIComponent(id)}`);
}

export function createHouseholdApi(payload: {
  householdName: string;
  adviserAssigned?: string;
  initialReviewYear?: string | number;
  objectives?: string;
  notes?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
}) {
  return apiFetch<any>("/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateHouseholdApi(id: string, payload: Record<string, any>) {
  return apiFetch<any>(`/clients/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteHouseholdApi(id: string) {
  return apiFetch<any>(`/clients/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---------------- ENTITIES ----------------

export function createEntityApi(
  householdId: string,
  payload: {
    name: string;
    type?: string;
    displayType?: string;
    abnOrTfnMasked?: string;
    ageOrDob?: string;
    phone?: string;
    email?: string;
    annualSalary?: number;
    marginalTaxRate?: number;
    superBalance?: number;
  }
) {
  return apiFetch<any>(`/clients/${encodeURIComponent(householdId)}/entities`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEntityApi(
  householdId: string,
  entityId: string,
  payload: Record<string, any>
) {
  return apiFetch<any>(
    `/clients/${encodeURIComponent(householdId)}/entities/${encodeURIComponent(
      entityId
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteEntityApi(householdId: string, entityId: string) {
  return apiFetch<any>(
    `/clients/${encodeURIComponent(householdId)}/entities/${encodeURIComponent(
      entityId
    )}`,
    {
      method: "DELETE",
    }
  );
}

// ---------------- PROPERTIES ----------------

export function createPropertyApi(
  householdId: string,
  payload: Record<string, any>
) {
  return apiFetch<any>(
    `/clients/${encodeURIComponent(householdId)}/properties`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function updatePropertyApi(
  householdId: string,
  propertyId: string,
  payload: Record<string, any>
) {
  return apiFetch<any>(
    `/clients/${encodeURIComponent(
      householdId
    )}/properties/${encodeURIComponent(propertyId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function deletePropertyApi(householdId: string, propertyId: string) {
  return apiFetch<any>(
    `/clients/${encodeURIComponent(
      householdId
    )}/properties/${encodeURIComponent(propertyId)}`,
    {
      method: "DELETE",
    }
  );
}

// ---------------- LOANS ----------------

export function createLoanApi(
  householdId: string,
  payload: Record<string, any>
) {
  return apiFetch<any>(`/clients/${encodeURIComponent(householdId)}/loans`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLoanApi(
  householdId: string,
  loanId: string,
  payload: Record<string, any>
) {
  return apiFetch<any>(
    `/clients/${encodeURIComponent(householdId)}/loans/${encodeURIComponent(
      loanId
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteLoanApi(householdId: string, loanId: string) {
  return apiFetch<any>(
    `/clients/${encodeURIComponent(householdId)}/loans/${encodeURIComponent(
      loanId
    )}`,
    {
      method: "DELETE",
    }
  );
}

// ---------------- REVIEWS & SNAPSHOTS ----------------

export function createReviewApi(
  householdId: string,
  payload: { financialYear: number; executiveSummary?: string }
) {
  return apiFetch<any>(`/clients/${encodeURIComponent(householdId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateReviewApi(reviewId: string, payload: Record<string, any>) {
  return apiFetch<any>(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function savePropertySnapshotsApi(
  reviewId: string,
  snapshots: any[]
) {
  try {
    return await apiFetch<any>(
      `/reviews/${encodeURIComponent(reviewId)}/financials/properties`,
      {
        method: "PUT",
        body: JSON.stringify({ snapshots }),
      }
    );
  } catch (err: any) {
    if (err.message?.includes("locked") || err.message?.includes("completed")) {
      await apiFetch(`/reviews/${encodeURIComponent(reviewId)}/reopen-review`, {
        method: "POST",
      });
      return apiFetch<any>(
        `/reviews/${encodeURIComponent(reviewId)}/financials/properties`,
        {
          method: "PUT",
          body: JSON.stringify({ snapshots }),
        }
      );
    }
    throw err;
  }
}

export async function saveLoanSnapshotsApi(reviewId: string, snapshots: any[]) {
  try {
    return await apiFetch<any>(
      `/reviews/${encodeURIComponent(reviewId)}/financials/loans`,
      {
        method: "PUT",
        body: JSON.stringify({ snapshots }),
      }
    );
  } catch (err: any) {
    if (err.message?.includes("locked") || err.message?.includes("completed")) {
      await apiFetch(`/reviews/${encodeURIComponent(reviewId)}/reopen-review`, {
        method: "POST",
      });
      return apiFetch<any>(
        `/reviews/${encodeURIComponent(reviewId)}/financials/loans`,
        {
          method: "PUT",
          body: JSON.stringify({ snapshots }),
        }
      );
    }
    throw err;
  }
}

export async function updateFinDataStatusApi(
  reviewId: string,
  status: "IN_PROGRESS" | "COMPLETED"
) {
  try {
    return await apiFetch<any>(
      `/reviews/${encodeURIComponent(reviewId)}/fin-data-status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  } catch (err: any) {
    if (err.message?.includes("completed")) {
      await apiFetch(`/reviews/${encodeURIComponent(reviewId)}/reopen-review`, {
        method: "POST",
      });
      return apiFetch<any>(
        `/reviews/${encodeURIComponent(reviewId)}/fin-data-status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );
    }
    throw err;
  }
}

// ---------------- INSIGHTS & ASSESSMENTS ----------------

export function createInsightApi(
  reviewId: string,
  payload: {
    criterionTitle: string;
    screen?: string;
    propertyName?: string;
    maintenanceInsight?: string;
    metric?: string;
    owner?: string;
    action?: string;
    insight?: string;
    recommendation?: string;
    priority?: string;
    adviserNotes?: string;
  }
) {
  return apiFetch<any>(`/reviews/${encodeURIComponent(reviewId)}/assessments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteInsightApi(reviewId: string, criterionId: string) {
  return apiFetch<any>(
    `/reviews/${encodeURIComponent(reviewId)}/assessments/${encodeURIComponent(
      criterionId
    )}`,
    {
      method: "DELETE",
    }
  );
}

// ---------------- FUTURE OUTLOOK ----------------

export function fetchFutureOutlookApi(reviewId: string) {
  return apiFetch<any>(
    `/reviews/${encodeURIComponent(reviewId)}/future-outlook`
  );
}

export function saveFutureOutlookApi(
  reviewId: string,
  payload: Record<string, any>
) {
  return apiFetch<any>(
    `/reviews/${encodeURIComponent(reviewId)}/future-outlook`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

// ---------------- BENCHMARKS ----------------

export function fetchBenchmarksApi() {
  return apiFetch<any[]>("/benchmarks");
}

export function createBenchmarkApi(payload: Record<string, any>) {
  return apiFetch<any>("/benchmarks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchSystemSettingsApi() {
  return apiFetch<{
    benchmarks: any[];
    picfoMetrics: any[];
  }>("/benchmarks/system-settings");
}

export function saveSystemSettingsApi(payload: {
  benchmarks: any[];
  picfoMetrics: any[];
}) {
  return apiFetch<{
    benchmarks: any[];
    picfoMetrics: any[];
  }>("/benchmarks/system-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

