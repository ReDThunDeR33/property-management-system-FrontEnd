"use client";

/* ============================================================
   ADMIN SIDEBAR (Client Component)
   ------------------------------------------------------------
   Course concepts demonstrated here:
   • "use client"  → this component needs browser interactivity
     (active-menu highlight + mobile drawer toggle), so it is a
     Client Component (part of our CSR story).
   • React Hook: usePathname() from next/navigation → highlights
     the currently active menu item based on the URL.
   • DaisyUI: <ul className="menu"> for the navigation list and
     DaisyUI drawer classes for the responsive mobile sidebar.
   • Visual design follows Admin-FIXED.html: dark sidebar
     (#17212B) with coral accent (#FF5A3D).
   ============================================================ */

import Link from "next/link";
import { usePathname } from "next/navigation";

// One place defines all admin routes (folder-based routing).
const ADMIN_MENU = [
  { href: "/admin", label: "Overview", icon: "⌂" },
  { href: "/admin/properties", label: "Properties", icon: "▦" },
  { href: "/admin/blocks", label: "Blocks", icon: "▤" },
  { href: "/admin/buildings", label: "Buildings", icon: "▥" },
  { href: "/admin/landlords", label: "Landlords", icon: "♙" },
  { href: "/admin/tenants", label: "Tenants", icon: "♟" },
  { href: "/admin/staff", label: "Staff", icon: "♧" },
  { href: "/admin/complaints", label: "Complaints", icon: "⚐" },
  { href: "/admin/announcements", label: "Announcements", icon: "◉" },
];

export default function AdminSidebar() {
  // usePathname is a React hook → re-renders on navigation and
  // lets us mark the active link without any state management.
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-admin-dark text-white">
      {/* Brand */}
      <div className="px-6 py-6">
        <p className="text-[11px] tracking-[0.2em] text-admin-muted">
          PROPERTY MANAGEMENT SYSTEM
        </p>
        <p className="mt-1 text-xl font-bold">
          Dwellix <span className="text-dwellix-500">Admin</span>
        </p>
      </div>

      {/* DaisyUI menu inside the sidebar */}
      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="menu w-full gap-1 p-0">
          {ADMIN_MENU.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    active
                      ? "bg-dwellix-500 text-white font-semibold"
                      : "text-admin-muted hover:bg-admin-dark-2 hover:text-white"
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-6">
        <ul className="menu w-full p-0">
          <li>
            <Link
              href="/"
              className="text-admin-muted hover:bg-admin-dark-2 hover:text-white"
            >
              <span>↪</span> Back to site
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
