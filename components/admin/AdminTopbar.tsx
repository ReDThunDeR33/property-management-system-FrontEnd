"use client";

/* ============================================================
   ADMIN TOPBAR (Client Component) — pure Tailwind
   ------------------------------------------------------------
   • Receives the logged-in admin's data via PROPS (from the
     server layout — the session flows into the UI).
   • "use client" so the logout button can clear the session
     cookies in the browser (cookie-based authentication flow,
     same pattern as the team's login page).
   ============================================================ */

import { useRouter } from "next/navigation";
import { btnSecondary } from "@/lib/adminUi";

type AdminTopbarProps = {
  adminName: string;
  adminEmail: string;
  pageTitle?: string;
};

export default function AdminTopbar({ adminName, adminEmail, pageTitle }: AdminTopbarProps) {
  const router = useRouter();

  // Logout: clear the same cookies the login page sets, then
  // send the user back to /login (client-side navigation).
  const handleLogout = () => {
    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "account_type=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
    router.push("/login");
  };

  // Initials avatar from the admin's name (e.g. "Eyamin Khan" → "EK")
  const initials = adminName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-3">
          {/* Mobile-only brand (sidebar is hidden on small screens) */}
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-dwellix-500 text-sm font-bold text-white md:hidden">
            D
          </span>
          <p className="hidden text-sm text-gray-500 sm:block">{pageTitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold leading-tight text-gray-900">{adminName}</p>
            <p className="text-[11px] text-gray-500">{adminEmail}</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-admin-dark text-xs font-bold text-white">
            {initials || "A"}
          </span>
          <button type="button" onClick={handleLogout} className={btnSecondary}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
