"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STAFF_MENU = [
  { href: "/staff/dashboard", label: "Dashboard" },
  { href: "/staff/work-orders", label: "Work Orders" },
  { href: "/staff/workers", label: "Workers" },
  { href: "/staff/issues", label: "Issues" },
  { href: "/staff/properties", label: "Properties" },
  { href: "/staff/tenants", label: "Tenants" },
  { href: "/staff/landlords", label: "Landlords" },
  { href: "/staff/reports/worker-performance", label: "Reports" },
  { href: "/staff/profile", label: "Profile" },
];

export default function StaffSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-admin-dark text-white">
      {/* Brand */}
      <div className="px-6 py-6">
        <p className="text-[11px] tracking-[0.2em] text-admin-muted">
          PROPERTY MANAGEMENT SYSTEM
        </p>
        <p className="mt-1 text-xl font-bold">
          Dwellix <span className="text-dwellix-500">Staff</span>
        </p>
      </div>

      {/* Nav menu */}
      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="w-full space-y-1">
          {STAFF_MENU.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-4 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-dwellix-500 font-semibold text-white"
                      : "text-admin-muted hover:bg-admin-dark-2 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}