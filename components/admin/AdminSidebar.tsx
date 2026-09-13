"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { section: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "" }] },
  {
    section: "Property",
    items: [
      { href: "/admin/properties", label: "Properties", icon: "" },
      { href: "/admin/buildings", label: "Buildings", icon: "" },
      { href: "/admin/blocks", label: "Blocks", icon: "" },
    ],
  },
  {
    section: "People",
    items: [
      { href: "/admin/landlords", label: "Landlords", icon: "" },
      { href: "/admin/tenants", label: "Tenants", icon: "" },
      { href: "/admin/staff", label: "Staff", icon: "" },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/admin/complaints", label: "Complaints", icon: "" },
      { href: "/admin/announcements", label: "Announcements", icon: "" },
    ],
  },
];

export default function AdminSidebar() {
  // usePathname returns the current URL path — used to mark the
  // active menu item (this is what replaced DaisyUI's menu-active).
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-admin-dark text-white md:flex">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-dwellix-500 font-bold">
          D
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">Dwellix</p>
          <p className="text-[10px] uppercase tracking-widest text-admin-muted">Admin Panel</p>
        </div>
      </div>

      {/* Menu sections */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {MENU.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-admin-muted">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                // Exact match for /admin, prefix match for sub-routes
                const active =
                  item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-dwellix-500 font-semibold text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="w-4 text-center text-xs">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <p className="px-5 pb-4 text-[10px] text-admin-muted">Dwellix © 2026</p>
    </aside>
  );
}
