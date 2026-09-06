/**
 * ResiliAI API service layer.
 *
 * All dashboard components should read data through these functions instead
 * of importing mock data directly. When the FastAPI backend is ready, set
 * NEXT_PUBLIC_API_BASE_URL and these functions will call the real endpoints
 * with zero changes needed in the UI components.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      `No backend configured (NEXT_PUBLIC_API_BASE_URL is empty). Falling back to mock data for ${path}.`
    );
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request to ${path} failed with ${res.status}`);
  return res.json();
}

export const api = {
  getRisk: () => request("/api/risk"),
  getWeather: () => request("/api/weather"),
  getAreas: () => request("/api/areas"),
  getAlerts: () => request("/api/alerts"),
  getReports: () => request("/api/reports"),
  submitReport: (payload: unknown) =>
    request("/api/reports", { method: "POST", body: JSON.stringify(payload) }),
  getEmergencyLocations: () => request("/api/emergency-locations"),
  sendChatMessage: (message: string) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ message }) }),
};
