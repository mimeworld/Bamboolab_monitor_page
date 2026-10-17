import type { PrintRecord, PrinterSettings, PrinterStatus, Reservation, Usage, User } from './types';

const base = '/api/v1';
type ApiErrorBody = { error?: { code?: string; message?: string } };
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`${base}${path}`, { credentials: 'same-origin', ...init }); }
  catch { throw new ApiError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.', 0); }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    throw new ApiError(body.error?.message || `요청에 실패했습니다. (${response.status})`, response.status, body.error?.code);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

async function mutate<T>(path: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', data?: unknown): Promise<T> {
  // 로그인 후 발급된 쿠키에 연결된 토큰을 변경 요청마다 새로 받아 만료·재로그인을 처리한다.
  const { token } = await request<{ token: string }>('/auth/csrf');
  return request<T>(path, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: data === undefined ? undefined : JSON.stringify(data) });
}

export const api = {
  me: () => request<{ user: User }>('/auth/me'),
  login: (loginId: string, password: string) => request<{ user: User }>('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loginId, password }) }),
  logout: () => mutate<void>('/auth/logout', 'POST'),
  changePassword: (currentPassword: string, newPassword: string) => mutate<void>('/auth/password', 'PATCH', { currentPassword, newPassword }),
  status: () => request<PrinterStatus>('/printer/status'),
  prints: (page = 1, range?: { from: string; to: string }) => {
    const query = new URLSearchParams({ page: String(page) });
    if (range) { query.set('from', range.from); query.set('to', range.to); }
    return request<{ items: PrintRecord[]; page: number }>(`/prints?${query}`);
  },
  myPrints: () => request<{ items: PrintRecord[] }>('/users/me/prints'),
  usage: () => request<Usage>('/users/me/usage'),
  reservations: (from: string, to: string) => request<{ items: Reservation[] }>(`/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  createReservation: (title: string, startAt: string, endAt: string) => mutate<{ id: string }>('/reservations', 'POST', { title, startAt, endAt }),
  cancelReservation: (id: string, version: number) => mutate<Reservation>(`/reservations/${encodeURIComponent(id)}/cancel`, 'POST', { version }),
  armReservation: (id: string) => mutate<Reservation>(`/reservations/${encodeURIComponent(id)}/arm`, 'POST'),
  disarmReservation: (id: string) => mutate<Reservation>(`/reservations/${encodeURIComponent(id)}/arm`, 'DELETE'),
  settings: () => request<PrinterSettings>('/admin/printer-settings'),
  testSettings: () => mutate<{ mqtt: { ok: boolean; message: string }; camera: { ok: boolean; message: string } }>('/admin/printer-settings/test', 'POST'),
  saveSettings: (settings: Partial<PrinterSettings> & { accessCode?: string; cameraSourceUrl?: string }) => mutate<PrinterSettings>('/admin/printer-settings', 'PUT', settings),
  adminUsers: () => request<{ items: User[] }>('/admin/users'),
  createUser: (loginId: string, displayName: string, password: string) => mutate<{ user: User }>('/admin/users', 'POST', { loginId, displayName, password }),
  updateUser: (id: string, patch: { displayName?: string; role?: User['role']; isActive?: boolean }) => mutate<{ user: User }>(`/admin/users/${encodeURIComponent(id)}`, 'PATCH', patch),
  resetUserPassword: (id: string, password: string) => mutate<void>(`/admin/users/${encodeURIComponent(id)}/reset-password`, 'POST', { password }),
  correctPrint: (id: string, patch: { version: number; reason: string; userId: string | null; actualFilamentG: number | null }) => mutate<{ id: string; version: number }>(`/admin/prints/${encodeURIComponent(id)}`, 'PATCH', patch),
};
