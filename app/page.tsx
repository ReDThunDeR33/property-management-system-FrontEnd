import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingShowcase from "@/components/landing/LandingShowcase";
import LandingFeatureGrid from "@/components/landing/LandingFeatureGrid";
import LandingRoles from "@/components/landing/LandingRoles";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingFooter from "@/components/landing/LandingFooter";

/* ============================================================
   LANDING PAGE — app/page.tsx  (the common entry route "/")
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. STATIC SITE GENERATION (SSG) — course table:
      "Marketing pages → SSG" and "Product landing pages → SSG".
      This page shows only public product information: no cookies
      are read, no user-specific data is fetched, and there is no
      browser interactivity here. Next.js therefore pre-renders it
      ONCE at build time and serves the same fast static HTML to
      every visitor (CDN-friendly, great for SEO).

   2. FOLDER-BASED ROUTING — this file is app/page.tsx, so Next.js
      automatically maps it to the "/" route. No route config file
      is needed; the folder structure IS the routing.

   3. COMPOSITION + PROPS — the page is assembled from small
      reusable components (LandingNavbar, LandingHero,
      LandingFeatureGrid, LandingRoles, LandingShowcase,
      LandingFaq, LandingFooter). Every text below is passed
      DOWN into those components via props — the components
      themselves hold no content, exactly like the Task2
      component examples.

   4. DAISYUI — navbar, menu, btn, collapse (FAQ accordion) and
      card classes come from the DaisyUI plugin configured in
      app/globals.css with our custom "dwellix" theme.

   NOTE: this public page intentionally shows NO real property,
   tenant, payment or operational records — private data lives in
   the authenticated workspaces (/admin, /landlord, /tenant,
   /staff), as the reference design describes.
   ============================================================ */

export default function LandingPage() {
  // ---- Content passed to the components via props -------------
  const heroProps = {
    eyebrow: "Dwellix — Property Management, Simplified",
    headlineTop: "Property management,",
    headlineBottom: "without the mess.",
    copy: "Dwellix brings property owners, administrators, staff, and tenants into one clear workspace — so properties stay organized, issues get resolved, and everyday management feels simple.",
    // Hero photo served from /public via next/image (optimized)
    imageSrc: "/property-01.jpg",
    imageAlt: "Dwellix platform preview",
  };

  const featureProps = {
    kicker: "Platform",
    titleTop: "The essentials,",
    titleBottom: "Less chasing.",
    intro:
      "A simple property management platform that brings the everyday essentials together — while keeping private property and user information inside authorized workspaces.",
    features: [
      {
        number: "01",
        title: "Stay Organized",
        copy: "Bring property-management workflows into one clean and structured digital experience.",
      },
      {
        number: "02",
        title: "Work Clearly",
        copy: "Keep everyday tasks and communication easier to follow from the right workspace.",
      },
      {
        number: "03",
        title: "Connect People",
        copy: "Help authorized users stay connected through a consistent property-management platform.",
      },
      {
        number: "04",
        title: "Protect Access",
        copy: "Keep personal, property and operational information inside the appropriate authorized workspace.",
      },
    ],
  };

  const rolesProps = {
    titleTop: "Built to make",
    titleBottom: "Simple for everyone.",
    intro:
      "Dwellix gives every authorized user a focused workspace while keeping private property information inside the secure areas where it belongs.",
    roles: [
      {
        number: "01 — ADMINISTRATOR",
        name: "Admin",
        copy: "Full oversight of properties, people and operational activity.",
        points: ["Manage users & properties", "Review complaints", "Publish announcements"],
      },
      {
        number: "02 — OWNER",
        name: "Landlord",
        copy: "Own the portfolio: properties, tenants and payments.",
        points: ["List properties", "Approve tenants", "Track rent & bills"],
      },
      {
        number: "03 — OPERATIONS",
        name: "Staff",
        copy: "Resolve issues with work orders and worker dispatching.",
        points: ["Triage issues", "Dispatch workers", "Complete work orders"],
      },
      {
        number: "04 — RESIDENT",
        name: "Tenant",
        copy: "A resident portal for rent, bills and maintenance requests.",
        points: ["Pay rent & bills", "Report issues", "Get announcements"],
      },
    ],
  };

  const showcaseProps = {
    kicker: "Public by default. Private where it matters.",
    titleTop: "See the platform.",
    titleBottom: "Never someone else's data.",
    intro:
      "The landing page is intentionally kept separate from private workspaces. Visitors can explore Dwellix without being shown property addresses, tenant information, financial figures, maintenance records or internal operations.",
    checks: [
      "Public pages contain no real property records",
      "No tenant or landlord information is displayed publicly",
      "No payments, transactions or maintenance records are exposed",
      "Private information is reserved for authorized workspaces",
    ],
    // Property screenshots from /public — rendered with next/image
    images: [
      { src: "/property-02.jpg", alt: "Dwellix admin dashboard", caption: "Admin workspace" },
      { src: "/property-04.jpg", alt: "Dwellix property overview", caption: "Property overview" },
      { src: "/property-03.png", alt: "Dwellix building view", caption: "Building view" },
    ],
  };

  const faqProps = {
    titleTop: "FAQs",
    titleBottom: "Before you step in.",
    intro: "A few quick answers about Dwellix.",
    faqs: [
      {
        question: "What is Dwellix?",
        answer:
          "Dwellix is a property management platform designed to bring everyday property operations into one organized digital experience.",
      },
      {
        question: "Can I explore Dwellix without an account?",
        answer:
          "Yes. The public landing page is designed to explain the platform without exposing private workspace information.",
      },
      {
        question: "Is private property information shown on this page?",
        answer:
          "No. The public page contains only general product information and intentionally avoids real property, tenant, payment and operational records.",
      },
      {
        question: "How do I access my workspace?",
        answer:
          "Use the Member Login button and continue through your authorized Dwellix access flow — Administrator, Landlord, Staff or Tenant.",
      },
      {
        question: "Will different users see different information?",
        answer:
          "Yes. Dwellix is structured around controlled access so users receive the workspace and information appropriate to their authorization.",
      },
    ],
  };

  const footerProps = {
    brand: "Dwellix",
    tagline: "Your trusted partner in property management. Connect properties, people, maintenance and money through one streamlined Dwellix experience.",
    accessTitle: "Access",
    accessLinks: [
      { label: "Member Login", href: "/login" },
      { label: "Admin Panel", href: "/admin" },
    ],
    supportTitle: "Support",
    supportEmail: "support@dwellix.com",
    copyright: "© 2026 Dwellix Property Management. All rights reserved.",
    wordmark: "Dwellix",
  };

  // ---- Static content (JSX format kept basic & readable) ------
  return (
    <main>
      <LandingNavbar />

      {/* Hero (props) */}
      <LandingHero {...heroProps} />

      {/* Trust bar — simple static strip like the reference */}
      <section className="border-y border-base-300 bg-[#f3f1eb] py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-gray-600">
            Trusted by property teams
          </p>
          <div className="flex flex-wrap gap-8 font-semibold text-gray-500">
            <span>• Property Management</span>
            <span>• Rent & Payments</span>
            <span>• Maintenance</span>
            <span>• Communication</span>
            <span>• Reporting</span>
          </div>
        </div>
      </section>

      {/* Feature grid (props) */}
      <LandingFeatureGrid {...featureProps} />

      {/* Roles (props) */}
      <LandingRoles {...rolesProps} />

      {/* Platform showcase — property screenshots (props, next/image).
          Follows the reference's "See the platform" showcase section. */}
      <LandingShowcase {...showcaseProps} />

      {/* How it works — 4 steps, kept as a simple static grid */}
      <section id="how" className="bg-[#f3f1eb] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-dwellix-500">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Get started in
              <br />
              four steps.
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded border border-[#d8d5cd] bg-[#d8d5cd] sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Choose your role",
                copy: "Administrator, Landlord, Staff or Tenant — start with the workspace built for you.",
              },
              {
                step: "2",
                title: "Sign in securely",
                copy: "Use your Dwellix account to enter your role-based workspace.",
              },
              {
                step: "3",
                title: "Enter your workspace",
                copy: "Your authorized workspace shows only the information and tools intended for your access level.",
              },
              {
                step: "4",
                title: "Get things done",
                copy: "Use your private workspace to manage the tasks and information relevant to you.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-[#f3f1eb] p-6">
                <p className="text-5xl font-bold text-dwellix-500">{item.step}</p>
                <h3 className="mt-8 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-gray-500">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ (props, DaisyUI collapse accordion) */}
      <LandingFaq {...faqProps} />

      {/* CTA banner — full-width orange block like the reference */}
      <section className="bg-dwellix-500 py-20 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Everything your property needs, in one place.
          </h2>
          <div className="max-w-sm">
            <p className="text-sm leading-7 opacity-90">
              Bring your property operation into one connected Dwellix experience.
            </p>
            <a
              href="/login"
              className="btn btn-lg mt-6 border-0 bg-white text-gray-900 hover:bg-gray-100"
            >
              Enter Dwellix →
            </a>
          </div>
        </div>
      </section>

      {/* Footer (props) */}
      <LandingFooter {...footerProps} />
    </main>
  );
}
