"use client";

/* ============================================================
   LANDING NAVBAR (Client Component)
   ------------------------------------------------------------
   Course concepts demonstrated here:
   • "use client" → the mobile menu toggle needs browser
     interactivity (useState), so this is a Client Component.
   • React Hook: useState → open/close the mobile dropdown.
   • DaisyUI: `navbar` component classes for the layout.
   • Folder-based routing: navigation uses Next <Link> to the
     real routes of the app (/login, /#features ...).
   • Visual design follows dwellix_landing_page_v4.html:
     sticky dark navbar (#252524) with orange logo mark.
   ============================================================ */

import Link from "next/link";
import { useState } from "react";

// Public nav links (anchors scroll inside this page; /login is a real route).
const NAV_LINKS = [
  { href: "/#platform", label: "Platform" },
  { href: "/#features", label: "Features" },
  { href: "/#roles", label: "Roles" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export default function LandingNavbar() {
  // useState controls the mobile menu visibility.
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#252524] text-white">
      <nav className="navbar mx-auto min-h-16 max-w-6xl px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-dwellix-500 font-bold">
            D
          </span>
          <span className="text-xl font-bold tracking-tight">Dwellix</span>
        </div>

        {/* Desktop links (hidden on small screens) */}
        <div className="hidden flex-1 items-center justify-center gap-7 text-[13px] text-gray-300 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions: Member Login (goes to the real login route) */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="btn btn-outline btn-sm border-gray-500 bg-transparent text-white hover:border-white hover:bg-transparent hover:text-white"
          >
            Member Login
          </Link>
          <Link href="/login" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger → toggles dropdown with useState */}
        <button
          className="btn btn-ghost btn-sm text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </nav>

      {/* Simple mobile menu (rendered only when menuOpen is true) */}
      {menuOpen && (
        <div className="border-t border-white/10 px-6 py-4 md:hidden">
          <ul className="menu gap-1 p-0">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-300 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-dwellix-500"
              >
                Member Login
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
