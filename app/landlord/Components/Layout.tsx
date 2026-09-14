
"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "../../../lib/axios";
import PusherNotifications from "./pushernotification";

type Props = {
  children: ReactNode;
};

type Toast = {
  id: string;
  type: "success" | "error";
  message: string;
};

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() || ""
    );
  }

  return null;
}

// Utility to erase cookie across standard path configurations
function deleteCookie(name: string) {
  if (typeof document === "undefined") return;

  document.cookie =
    `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

const navItems = [
  {
    href: "/landlord/Dashboard",
    label: "Dashboard",
  },
  {
    href: "/landlord/Properties",
    label: "My Properties",
  },
  {
    href: "/landlord/Tenants",
    label: "Tenants",
  },
  {
    href: "/landlord/Issues",
    label: "Issues",
  },
  {
    href: "/landlord/WorkOrders",
    label: "Work Orders",
  },
  {
    href: "/landlord/Transactions",
    label: "Transactions",
  },
  {
    href: "/landlord/Reviews",
    label: "Reviews",
  },
];

export default function Layout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [user, setUser] = useState<any>(null);

  // Check login and load landlord information
  useEffect(() => {
    const userData = getCookie("user");
    const token = getCookie("access_token");

    if (!userData || !token) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);

      if (parsedUser.account_type !== "landlord") {
        router.push("/login");
        return;
      }

      setUser(parsedUser);
    } catch (err) {
      console.error("Error parsing user cookie:", err);
      router.push("/login");
    }
  }, [router]);

  const currentYear = useMemo(
    () => new Date().getFullYear(),
    []
  );

  // Normal layout toast
  const showToast = (
    type: "success" | "error",
    message: string
  ) => {
    const id = crypto.randomUUID();

    setToasts((prev) => [
      ...prev,
      {
        id,
        type,
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((toast) => toast.id !== id)
      );
    }, 2600);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  const getInitials = (name?: string) => {
    if (!name) return "LA";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Complete Logout Handler
  const handleLogout = () => {
    // 1. Destroy auth cookies
    deleteCookie("user");
    deleteCookie("access_token");

    // 2. Clear state
    setUser(null);

    // 3. Show confirmation feedback
    showToast(
      "success",
      "Successfully logged out."
    );

    // 4. Redirect to login page
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f6] text-[#202124]">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-10 flex-shrink-0 sticky top-0 z-20">

        {/* Logo / Mobile Menu */}
        <div className="flex items-center gap-3">

          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden -ml-1 p-2 text-gray-500 hover:text-[#FF5A3D]"
            aria-label="Open menu"
          >
            ☰
          </button>

          <Link
            href="/landlord/Dashboard"
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FF5A3D] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              ⌂
            </div>

            <div className="hidden sm:block">
              <h1 className="font-bold text-xl tracking-tight">
                Dwellix
              </h1>

              <p className="text-xs text-gray-400">
                PROPERTY MANAGEMENT
              </p>
            </div>
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3 sm:gap-5">

          {/* Notification Button */}
          <button
            onClick={() =>
              showToast(
                "success",
                "You have no new notifications right now."
              )
            }
            className="relative text-gray-500 hover:text-[#FF5A3D] transition"
          >
            <span className="text-xl">
              🔔
            </span>

            <span className="absolute top-0 right-0 w-2 h-2 bg-[#FF5A3D] rounded-full animate-pulse"></span>
          </button>

          {/* User Information */}
          <div className="flex items-center gap-3 border-l pl-3 sm:pl-5">

            <div className="hidden sm:block text-right">
              <p className="font-medium text-sm">
                {user?.name || "Landlord"}
              </p>

              <p className="text-xs text-gray-400">
                {user?.role || "Landlord"}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold flex-shrink-0">
              {getInitials(user?.name)}
            </div>

          </div>
        </div>
      </header>


      {/* =====================================================
          MOBILE SIDEBAR OVERLAY
      ====================================================== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}


      {/* =====================================================
          MAIN AREA
      ====================================================== */}
      <div className="flex flex-1 min-w-0">

        {/* ===================================================
            SIDEBAR
        ==================================================== */}
        <aside
          className={`
            w-64
            lg:min-h-[calc(100vh-80px)]
            h-[calc(100vh-80px)]
            lg:h-auto
            bg-white
            border-r
            border-gray-200
            flex
            flex-col
            overflow-y-auto
            fixed
            lg:static
            top-20
            left-0
            bottom-0
            z-40
            transition-transform
            duration-200
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >

          {/* Main Menu */}
          <div className="p-5">

            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
              Main Menu
            </p>

            <div className="space-y-1">

              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    text-left
                    transition
                    ${
                      isActive(item.href)
                        ? "bg-[#fff0ed] text-[#FF5A3D] font-semibold"
                        : "text-gray-600 hover:bg-[#fff0ed] hover:text-[#FF5A3D]"
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}

            </div>
          </div>


          {/* Bottom Menu */}
          <div className="mt-auto p-5 border-t border-gray-100">

            {/* Settings */}
            <Link
              href="/landlord/Settings"
              onClick={closeSidebar}
              className={`
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                text-left
                transition
                ${
                  isActive("/landlord/Settings")
                    ? "bg-[#fff0ed] text-[#FF5A3D] font-semibold"
                    : "text-gray-600 hover:bg-[#fff0ed] hover:text-[#FF5A3D]"
                }
              `}
            >
              ⚙ Settings
            </Link>


            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 text-left mt-1 hover:bg-red-50 transition"
            >
              ↪ Logout
            </button>

          </div>
        </aside>


        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden lg:ml-0">
          {children}
        </main>

      </div>


      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="bg-[#111111] text-gray-400 py-16 px-6 lg:px-10 w-full mt-auto">

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-gray-800 pb-16">

          {/* Description */}
          <div className="md:col-span-2">

            <h3 className="text-white font-semibold text-lg mb-4">
              Your trusted partner in property management.
            </h3>

            <p className="text-sm max-w-sm leading-relaxed text-gray-500">
              Track rent collection, manage tenants, and coordinate
              maintenance work orders — all from a single landlord
              dashboard.
            </p>

          </div>


          {/* Quick Links */}
          <div>

            <h4 className="text-white font-medium mb-5 text-sm uppercase tracking-wider">
              Quick Links
            </h4>

            <ul className="space-y-3 text-sm">

              <li>
                <Link
                  href="/landlord/Properties"
                  className="hover:text-[#FF5A3D] transition"
                >
                  My Properties
                </Link>
              </li>

              <li>
                <Link
                  href="/landlord/Tenants"
                  className="hover:text-[#FF5A3D] transition"
                >
                  Tenants
                </Link>
              </li>

              <li>
                <Link
                  href="/landlord/Transactions"
                  className="hover:text-[#FF5A3D] transition"
                >
                  Transactions
                </Link>
              </li>

            </ul>
          </div>


          {/* Support */}
          <div>

            <h4 className="text-white font-medium mb-5 text-sm uppercase tracking-wider">
              Support
            </h4>

            <ul className="space-y-3 text-sm">

              <li>
                <a
                  href="mailto:support@dwellix.com"
                  className="hover:text-[#FF5A3D] transition"
                >
                  Contact Support
                </a>
              </li>

              <li>
                <Link
                  href="/landlord/Settings"
                  className="hover:text-[#FF5A3D] transition"
                >
                  Account Settings
                </Link>
              </li>

              <li className="text-gray-500">
                Email:{" "}
                <a
                  href="mailto:support@dwellix.com"
                  className="hover:text-[#FF5A3D] transition"
                >
                  support@dwellix.com
                </a>
              </li>

              <li className="text-gray-500">
                Phone:{" "}
                <a
                  href="tel:+18005550142"
                  className="hover:text-[#FF5A3D] transition"
                >
                  +1 (800) 555-0142
                </a>
              </li>

            </ul>
          </div>

        </div>


        {/* Footer Bottom */}
        <div className="max-w-7xl mx-auto pt-10">

          <h1 className="text-[12vw] leading-none font-bold text-[#FF5A3D] tracking-tighter hover:opacity-90 transition-colors cursor-default">
            Dwellix
          </h1>

          <div className="flex flex-col md:flex-row justify-between items-center text-xs mt-6 text-gray-500 gap-3">

            <p>
              Copyright © {currentYear} Dwellix Property Management.
              All rights reserved.
            </p>

            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
              System Status: Online
            </p>

          </div>
        </div>

      </footer>


      
      <div className="fixed right-5 bottom-5 z-[60] flex flex-col gap-2">

        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              min-w-[220px]
              max-w-[320px]
              px-4
              py-3
              rounded-xl
              text-white
              text-sm
              shadow-lg
              ${
                toast.type === "error"
                  ? "bg-red-600"
                  : "bg-green-600"
              }
            `}
          >
            {toast.message}
          </div>
        ))}

      </div>


      
      <PusherNotifications />

    </div>
  );
}

