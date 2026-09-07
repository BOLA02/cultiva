const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error { constructor(message: string, public status: number, public details?: unknown) { super(message); } }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(payload.message || 'Something went wrong', response.status, payload.errors);
  return payload;
}

export const money = (amount: number, currency = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
export const date = (value: string) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value));
