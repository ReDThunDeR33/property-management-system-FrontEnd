"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

type Toast = {
  id: string;
  type: "success" | "error";
  message: string;
};

const navItems = [
  { href: "/Landlord/Dashboard", label: "Dashboard", icon: "▦" },
  { href: "/Landlord/Properties", label: "My Properties", icon: "⌂" },
  { href: "/Landlord/Tenants", label: "Tenants", icon: "👥" },
  { href: "/Landlord/Issues", label: "Issues", icon: "⚠" },
  { href: "/Landlord/WorkOrders", label: "Work Orders", icon: "🔧", badge: "3" },
  { href: "/Landlord/Workers", label: "Workers", icon: "🧰" },
  { href: "/Landlord/Transactions", label: "Transactions", icon: "◫" },
  { href: "/Landlord/Reviews", label: "Reviews", icon: "★" },
];

export default function Layout({ children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const showToast = (type: "success" | "error", message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f6] text-[#202124]">
      {/* Header */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-10 flex-shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden -ml-1 p-2 text-gray-500 hover:text-[#FF5A3D]"
            aria-label="Open menu"
          >
            ☰
          </button>

          <Link href="/Landlord/Dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-11 h-11 rounded-xl bg-[#FF5A3D] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">⌂</div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-xl tracking-tight">Dwellix</h1>
              <p className="text-xs text-gray-400">PROPERTY MANAGEMENT</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={() => showToast("success", "You have no new notifications right now.")}
            className="relative text-gray-500 hover:text-[#FF5A3D] transition"
          >
            <span className="text-xl">🔔</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#FF5A3D] rounded-full animate-pulse"></span>
          </button>
          <div className="flex items-center gap-3 border-l pl-3 sm:pl-5">
            <div className="hidden sm:block text-right">
              <p className="font-medium text-sm">John Anderson</p>
              <p className="text-xs text-gray-400">Landlord</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold flex-shrink-0">JA</div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={closeSidebar} />
      )}

      <div className="flex flex-1 min-w-0">
        {/* Sidebar */}
        <aside
          className={`w-64 lg:min-h-[calc(100vh-80px)] h-[calc(100vh-80px)] lg:h-auto bg-white border-r border-gray-200 flex flex-col overflow-y-auto fixed lg:static top-20 left-0 bottom-0 z-40 transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-5">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Main Menu</p>
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                    isActive(item.href)
                      ? "bg-[#fff0ed] text-[#FF5A3D] font-semibold"
                      : "text-gray-600 hover:bg-[#fff0ed] hover:text-[#FF5A3D]"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                  {item.badge ? (
                    <span className="ml-auto bg-[#fff0ed] text-[#FF5A3D] text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-auto p-5 border-t border-gray-100">
            <Link
              href="/Landlord/Settings"
              onClick={closeSidebar}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                isActive("/Landlord/Settings")
                  ? "bg-[#fff0ed] text-[#FF5A3D] font-semibold"
                  : "text-gray-600 hover:bg-[#fff0ed] hover:text-[#FF5A3D]"
              }`}
            >
              ⚙ Settings
            </Link>

            <button
              onClick={() => showToast("success", "You have been logged out.")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 text-left mt-1 hover:bg-red-50 transition"
            >
              ↪ Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden lg:ml-0">{children}</main>
      </div>

      {/* Footer */}
      <footer className="bg-[#111111] text-gray-400 py-16 px-6 lg:px-10 w-full mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-gray-800 pb-16">
          <div className="md:col-span-2">
            <h3 className="text-white font-semibold text-lg mb-4">
              Your trusted partner in property management.
            </h3>
            <p className="text-sm max-w-sm leading-relaxed text-gray-500">
              Track rent collection, manage tenants, and coordinate maintenance work orders — all from a single landlord dashboard.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-5 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/Landlord/Properties" className="hover:text-[#FF5A3D] transition">My Properties</Link></li>
              <li><Link href="/Landlord/Tenants" className="hover:text-[#FF5A3D] transition">Tenants</Link></li>
              <li><Link href="/Landlord/Transactions" className="hover:text-[#FF5A3D] transition">Transactions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-5 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="mailto:support@dwellix.com" className="hover:text-[#FF5A3D] transition">Contact Support</a></li>
              <li><Link href="/Landlord/Settings" className="hover:text-[#FF5A3D] transition">Account Settings</Link></li>
              <li className="text-gray-500">Email: <a href="mailto:support@dwellix.com" className="hover:text-[#FF5A3D] transition">support@dwellix.com</a></li>
              <li className="text-gray-500">Phone: <a href="tel:+18005550142" className="hover:text-[#FF5A3D] transition">+1 (800) 555-0142</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-10">
          <h1 className="text-[12vw] leading-none font-bold text-[#FF5A3D] tracking-tighter hover:opacity-90 transition-colors cursor-default">
            Dwellix
          </h1>
          <div className="flex flex-col md:flex-row justify-between items-center text-xs mt-6 text-gray-500 gap-3">
            <p>Copyright © {currentYear} Dwellix Property Management. All rights reserved.</p>
            <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 block"></span> System Status: Online</p>
          </div>
        </div>
      </footer>

      {/* Toast Container */}
      <div className="fixed right-5 bottom-5 z-[60] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[220px] max-w-[320px] px-4 py-3 rounded-xl text-white text-sm shadow-lg ${
              toast.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}