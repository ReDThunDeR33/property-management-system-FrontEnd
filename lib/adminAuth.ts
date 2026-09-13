import { cookies } from "next/headers";

/* ============================================================
   AUTH HELPERS (Course: "Authentication" — week 14 slides)
   ------------------------------------------------------------
   The login page (app/login/page.tsx) stores the JWT and the
   logged-in user in browser cookies after a successful
   POST /auth/login (Axios). This helper reads those cookies on
   the SERVER (Server Components) so admin pages can:
     1. verify the user is logged in (JWT cookie exists)
     2. verify the logged-in role is "admin"
     3. read the admin's id/name/email to personalize the UI
     4. forward the JWT as an Authorization header on Axios
        server-side requests (Bearer token pattern)

   NOTE: cookies() is asynchronous in Next.js 15+ / 16, so we
   await it. Using cookies() is also what makes a page render
   DYNAMICALLY (per-request) instead of being statically
   pre-rendered — that is intentional for authenticated pages.
   ============================================================ */

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  account_type: string;
};

export type AdminSession = {
  token: string;
  user: AdminUser;
};

// Build the Authorization header our backend guards expect.
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Read + validate the admin session from cookies (server-side).
// Returns null when nobody is logged in or the role is not admin —
// the /admin layout redirects to /login in that case.
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  const tokenCookie = cookieStore.get("access_token");
  const userCookie = cookieStore.get("user");
  const roleCookie = cookieStore.get("account_type");

  if (!tokenCookie || !userCookie) return null;

  let user: AdminUser;
  try {
    user = JSON.parse(decodeURIComponent(userCookie.value));
  } catch {
    return null;
  }

  // Role check — this area is admin-only (authorization).
  const role = roleCookie ? decodeURIComponent(roleCookie.value) : user.account_type;
  if (role !== "admin") return null;

  return { token: decodeURIComponent(tokenCookie.value), user };
}
