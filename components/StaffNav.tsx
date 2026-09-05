"use client";

// Optional simple nav you can drop into your staff layout's sidebar.
// It doesn't assume anything about your existing sidebar markup —
// just plain links, styled the same way as the rest of the staff pages.

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/staff/dashboard", label: "Dashboard" },
  { href: "/staff/dashboard/workload", label: "Workload" },
  { href: "/staff/work-orders", label: "Work Orders" },
  { href: "/staff/workers", label: "Workers" },
  { href: "/staff/issues", label: "Issues" },
  { href: "/staff/properties", label: "Properties" },
  { href: "/staff/tenants", label: "Tenants" },
  { href: "/staff/landlords", label: "Landlords" },
  { href: "/staff/buildings", label: "Buildings" },
  { href: "/staff/blocks", label: "Blocks" },
  { href: "/staff/admins", label: "Admins" },
  { href: "/staff/reports/worker-performance", label: "Worker Report" },
  { href: "/staff/reports/work-order-summary", label: "Order Summary" },
  { href: "/staff/profile", label: "Profile" },
];

export default function StaffNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded-lg text-sm ${
              active ? "bg-dwellix-500 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
