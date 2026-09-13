import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminAnnouncementToast from "@/components/admin/AdminAnnouncementToast";
import { getAdminSession } from "@/lib/adminAuth";

/* ============================================================
   ADMIN LAYOUT — app/admin/layout.tsx  (pure Tailwind shell)
   ------------------------------------------------------------
   Course concepts demonstrated here:

   1. FOLDER-BASED ROUTING / LAYOUTS
      Every file inside app/admin/ automatically gets this shell
      (sidebar + topbar). Next.js applies the closest layout.tsx
      to all nested routes — the course's "layout" idea.

   2. AUTHENTICATION + AUTHORIZATION
      The login page stores the JWT in browser COOKIES after
      POST /auth/login (Axios). Here on the server we read those
      cookies (getAdminSession helper — next/headers cookies()):
        • not logged in  → redirect to /login (authentication)
        • logged in but NOT an admin → redirect to /login
          (authorization: this area is admin-only)
      Reading cookies() also forces DYNAMIC per-request rendering,
      correct for an authenticated area (course table:
      "Authenticated account page → SSR").

   3. COMPONENT COMPOSITION + PROPS
      AdminSidebar and AdminTopbar are reusable components; the
      admin's session data flows into the topbar via PROPS.

   4. PURE TAILWIND — no DaisyUI: the shell, cards, menus and
      buttons are plain Tailwind utility classes (lib/adminUi).
   ============================================================ */

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Server-side session check (authentication + role authorization).
  const session = await getAdminSession();

  if (!session) {
    // Not logged in as admin → back to the login page.
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f6f5f2]">
      {/* Left: dark admin sidebar (pure Tailwind menu) */}
      <AdminSidebar />

      {/* Right: topbar + the actual page */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          adminName={session.user.name}
          adminEmail={session.user.email}
          pageTitle="Admin Panel"
        />
        <main className="flex-1 space-y-6 p-6">{children}</main>

        {/* PUSHERJS REAL-TIME TOASTS (bonus feature): subscribes to
            the "announcements" channel and pops a toast whenever a
            new announcement is published anywhere in the app. */}
        <AdminAnnouncementToast />
      </div>
    </div>
  );
}
