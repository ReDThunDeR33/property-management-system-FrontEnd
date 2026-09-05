// Small client-side helpers for reading/writing the same cookies your
// server components already read with next/headers cookies().

export function getClientToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getClientUser(): { id: number; name: string; email: string } | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function setClientUser(user: Record<string, unknown>) {
  document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/`;
}

export function authHeader() {
  const token = getClientToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
