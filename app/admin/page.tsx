import { cookies } from "next/headers";
import axios from "axios";
import { z } from "zod";
import Link from "next/link";
import { getAdminSession, authHeader } from "@/lib/adminAuth";
import { AdminCard, AdminAlert, AdminBadge, AdminPageHeader } from "@/lib/adminUi";

/* ============================================================
   ADMIN DASHBOARD — app/admin/page.tsx  (pure Tailwind, SSR)
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. SSR (SERVER-SIDE RENDERING) — course table:
      "Personalized dashboard → SSR" + "Authenticated account
      page → SSR". This is an async Server Component: on EVERY
      request the server reads the admin's cookies, calls the
      backend with Axios (server-side), validates responses with
      Zod, computes the stats and only then sends the complete
      HTML to the browser.

   2. AUTHENTICATION — the JWT is read from the cookie set by
      the login page (cookies() from next/headers) and forwarded
      as `Authorization: Bearer <token>` on every Axios call.

   3. AXIOS ONLY — all backend communication goes through
      axios with the NEXT_PUBLIC_API_URL env var (course
      convention). `fetch` is never used.

   4. ZOD VALIDATION — every API response is checked against a
      Zod schema (safeParse) before it is used; unexpected
      shapes fail soft instead of crashing the page.

   5. FAIL-SOFT RENDERING — if the backend is down, the page
      still renders with zeros and an info banner.
   ============================================================ */

// Base URL from the course-standard env variable (.env.local)
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/* ---------- Zod schemas (validate backend responses) ---------- */
const idNameSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const announcementSchema = z.object({
  id: z.number(),
  title: z.string(),
  created_at: z.string(),
  created_by: idNameSchema.nullish(),
});

const complaintSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.string(),
});

const personSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string().nullish(),
});

const propertySchema = z.object({ id: z.number() });
const blockSchema = z.object({ id: z.number() });
const buildingSchema = z.object({ id: z.number() });

/* ---------- Fail-soft fetch helper (SSR + Axios + Zod) ---------- */
async function fetchList<T>(
  path: string,
  token: string,
  schema: z.ZodType<T>,
): Promise<{ data: T[]; ok: boolean }> {
  try {
    const response = await axios.get(`${API}/admin/${path}`, {
      headers: authHeader(token),
      timeout: 8000,
    });
    const parsed = z.array(schema).safeParse(response.data);
    if (!parsed.success) return { data: [], ok: false };
    return { data: parsed.data, ok: true };
  } catch {
    // Backend down / unauthorized → render with empty data.
    return { data: [], ok: false };
  }
}

export default async function AdminDashboard() {
  // 1) Session from cookies (authentication + role check)
  const session = await getAdminSession();

  // 2) Parallel SSR data fetching — 8 endpoints at once
  const token = session?.token ?? "";
  const [announcements, complaints, landlords, tenants, staff, properties, blocks, buildings] =
    await Promise.all([
      fetchList("announcement/allannouncements", token, announcementSchema),
      fetchList("complaint/allcomplaints", token, complaintSchema),
      fetchList("landlord/alllandlord", token, personSchema),
      fetchList("tenant/alltenants", token, personSchema),
      fetchList("staff/allstaff", token, personSchema),
      fetchList("property/allproperties", token, propertySchema),
      fetchList("block/allblocks", token, blockSchema),
      fetchList("building/allbuildings", token, buildingSchema),
    ]);

  const backendDown = !announcements.ok && !complaints.ok && !landlords.ok;

  // 3) Derived stats
  const openComplaints = complaints.data.filter((c) => c.status !== "RESOLVED").length;
  const pendingTenants = tenants.data.filter(
    (t) => (t.status ?? "").toUpperCase() === "PENDING",
  ).length;
  const latestAnnouncements = [...announcements.data]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  const quickLinks = [
    { href: "/admin/announcements", label: "Announcements", desc: "Publish & manage notices" },
    { href: "/admin/complaints", label: "Complaints", desc: "Inspect & resolve" },
    { href: "/admin/landlords", label: "Landlords", desc: "Add & manage owners" },
    { href: "/admin/tenants", label: "Tenants", desc: "Approvals & records" },
    { href: "/admin/staff", label: "Staff", desc: "Operations team" },
    { href: "/admin/properties", label: "Properties", desc: "Units & pricing" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Welcome back, ${session?.user.name ?? "Admin"}`}
        subtitle="Live overview of your property operation."
      />

      {backendDown && (
        <AdminAlert kind="warning">
          Backend data unavailable right now — showing zeroed stats. Check that the API server is
          running.
        </AdminAlert>
      )}

      {/* Stat cards (pure Tailwind AdminCard, values via props) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard
          title="Announcements"
          value={announcements.data.length}
          hint="Published notices"
          accent
        />
        <AdminCard
          title="Open Complaints"
          value={openComplaints}
          hint={`${complaints.data.length} total filed`}
        />
        <AdminCard
          title="Pending Tenants"
          value={pendingTenants}
          hint={`${tenants.data.length} tenants total`}
        />
        <AdminCard
          title="Properties"
          value={properties.data.length}
          hint={`${buildings.data.length} buildings · ${blocks.data.length} blocks`}
        />
        <AdminCard title="Landlords" value={landlords.data.length} hint="Property owners" />
        <AdminCard title="Tenants" value={tenants.data.length} hint="Registered residents" />
        <AdminCard title="Staff" value={staff.data.length} hint="Operations team" />
        <AdminCard title="Buildings" value={buildings.data.length} hint={`${blocks.data.length} blocks`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest announcements */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Latest Announcements
            </h2>
            <Link href="/admin/announcements" className="text-xs font-semibold text-dwellix-600 hover:underline">
              View all →
            </Link>
          </div>
          {latestAnnouncements.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No announcements yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {latestAnnouncements.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500">
                      by {a.created_by?.name ?? "Admin"} ·{" "}
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">#{a.id}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Complaint queue snapshot */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Complaint Queue
            </h2>
            <Link href="/admin/complaints" className="text-xs font-semibold text-dwellix-600 hover:underline">
              Inspect all →
            </Link>
          </div>
          {complaints.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No complaints filed — all clear.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {complaints.data.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <Link
                    href={`/admin/complaints/${c.id}`}
                    className="truncate text-sm font-semibold text-gray-900 hover:text-dwellix-600"
                  >
                    {c.title}
                  </Link>
                  <AdminBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick access tiles */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
          Quick Access
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-dwellix-500 hover:shadow-md"
            >
              <p className="text-sm font-bold text-gray-900 group-hover:text-dwellix-600">
                {link.label} →
              </p>
              <p className="mt-1 text-xs text-gray-500">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
