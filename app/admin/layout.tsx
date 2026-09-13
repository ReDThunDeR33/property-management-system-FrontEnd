import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminAnnouncementToast from "@/components/admin/AdminAnnouncementToast";
import { getAdminSession } from "@/lib/adminAuth";

/* ============================================================
   ADMIN LAYOUT — app/admin/layout.tsx
   ------------------------------------------------------------
   Course concepts demonstrated here:

   1. FOLDER-BASED ROUTING / LAYOUTS
      Every file inside app/admin/ automatically gets this shell
      (sidebar + topbar). Next.js applies the closest layout.tsx
      to all nested routes — this is the course's "layout" idea.

   2. AUTHENTICATION + AUTHORIZATION (Course: week 14)
      The login page stores the JWT in a cookie after
      POST /auth/login (Axios). Here on the server we read that
      cookie (getAdminSession helper) and:
        • not logged in  → redirect to /login (authentication)
        • logged in but NOT an admin → redirect to /login
          (authorization: this area is admin-only)
      Reading cookies() also forces DYNAMIC per-request rendering,
      which is correct for an authenticated area (course table:
      "Authenticated account page → SSR").

   3. COMPONENT COMPOSITION
      AdminSidebar and AdminTopbar are separate reusable
      components; the admin's data flows into the topbar via
      PROPS.
   ============================================================ */

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Server-side session check (authentication + role authorization).
  const session = await getAdminSession();

  if (!session) {
    // Not logged in as admin → back to the login page.
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Left: dark admin sidebar (DaisyUI menu) */}
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
