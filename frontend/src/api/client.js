const TOKEN_KEY = "nirakshan_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (_) {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res;
}

export const api = {
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  me: () => request("/api/auth/me"),

  createInspection: (payload) => request("/api/inspections", { method: "POST", body: payload }),
  uploadImages: (id, formData) => request(`/api/inspections/${id}/images`, { method: "POST", body: formData, isForm: true }),
  analyzeInspection: (id) => request(`/api/inspections/${id}/analyze`, { method: "POST" }),
  getInspection: (id) => request(`/api/inspections/${id}`),
  getDemoInspection: (key) => request(`/api/inspections/demo/${key}`),
  listInspections: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/api/inspections${qs ? `?${qs}` : ""}`);
  },
  reportUrl: (id) => `/api/inspections/${id}/report?token=${encodeURIComponent(getToken() || "")}`,

  dashboardStats: () => request("/api/dashboard/stats"),
  analytics: () => request("/api/analytics"),

  listRules: () => request("/api/rules"),
  updateRule: (ruleId, payload) => request(`/api/rules/${ruleId}`, { method: "PUT", body: payload }),

  listUsers: () => request("/api/users"),
  createUser: (payload) => request("/api/users", { method: "POST", body: payload }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
};
