import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import Link from "next/link";
import { getAdminSession } from "@/lib/adminAuth";
import axios from "axios";
import { z } from "zod";

/* ============================================================
   ADMIN DASHBOARD — app/admin/page.tsx
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. SERVER-SIDE RENDERING (SSR) — course table:
      "Personalized dashboard -> SSR (or SSR + CSR)" and
      "Authenticated account page -> SSR".
      This is an ASYNC SERVER COMPONENT: Next.js renders it on
      the server for every request. It reads the request cookies
      (JWT + user) and fetches fresh counts from the backend
      right here on the server, so the browser receives fully
      populated HTML - no client-side loading spinner needed.

   2. AUTHENTICATION (course: week 14)
      The JWT cookie stored by /login is read server-side
      (getAdminSession helper) and forwarded to the backend as
      "Authorization: Bearer <token>".

   3. AXIOS (course: Axios.pptx) - axios is imported directly
      and the backend URL comes from the NEXT_PUBLIC_API_URL
      environment variable defined in .env.local (the course
      convention: axios.get(process.env.NEXT_PUBLIC_API_URL + ...)).
      fetch() is never used anywhere in this project.

   4. ZOD - every backend response is validated with a Zod
      schema (schema -> z.infer type -> safeParse) before use,
      the course's Zod pattern applied to API responses.

   5. FOLDER-BASED ROUTING - app/admin/page.tsx = route /admin.
   ============================================================ */

// ---- Zod schemas for the backend responses (server-side) ----
const adminRefSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const announcementSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  created_at: z.string(),
  created_by: adminRefSchema.nullable(),
});

const complaintSchema = z.object({
  id: z.number(),
  filed_by_type: z.string(),
  filed_by_id: z.number(),
  against_type: z.string(),
  against_id: z.number().nullable(),
  description: z.string(),
  status: z.string(),
  admin_note: z.string().nullable(),
  reviewed_by: adminRefSchema.nullable(),
  created_at: z.string(),
});

const personSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  status: z.string(),
});

const propertySchema = z.object({
  id: z.number(),
  unit_number: z.string(),
  status: z.string(),
});

const blockSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const buildingSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// The admin list endpoints return bare JSON arrays.
const announcementsSchema = z.array(announcementSchema);
const complaintsSchema = z.array(complaintSchema);
const landlordsSchema = z.array(personSchema);
const tenantsSchema = z.array(personSchema);
const staffSchema = z.array(personSchema);
const propertiesSchema = z.array(propertySchema);
const blocksSchema = z.array(blockSchema);
const buildingsSchema = z.array(buildingSchema);

// Small helper: GET with the admin's JWT, then Zod-validate.
// (Server-side Axios + Zod - the SSR data-fetching pattern.)
// The base URL comes from .env.local -> NEXT_PUBLIC_API_URL.
async function fetchValidated<T>(
  url: string,
  token: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  try {
    const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const parsed = schema.safeParse(response.data);
    if (!parsed.success) {
      console.error(`Zod validation failed for ${url}`);
      return null;
    }
    return parsed.data;
  } catch (error) {
    // Backend down / unexpected response -> render with zeros
    // instead of crashing the whole dashboard (fail-soft).
    console.error(`Axios request failed for ${url}`);
    return null;
  }
}

export default async function AdminDashboardPage() {
  // 1. AUTH: read the admin session (JWT + user) from cookies.
  const session = await getAdminSession();

  // The /admin layout already redirects non-admins; this is
  // simple defense in depth for the page itself.
  if (!session) {
    return (
      <div className="card mx-auto max-w-md border border-base-300 bg-white shadow-sm">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Session required</h2>
          <p className="text-sm text-gray-500">
            Please log in as an admin again.
          </p>
        </div>
      </div>
    );
  }

  const { token } = session;

  // 2. SSR DATA FETCH: live backend calls (Axios, server-side).
  const [announcements, complaints, landlords, tenants, staff, properties, blocks, buildings] =
    await Promise.all([
      fetchValidated("/admin/announcement/allannouncements", token, announcementsSchema),
      fetchValidated("/admin/complaint/allcomplaints", token, complaintsSchema),
      fetchValidated("/admin/landlord/alllandlord", token, landlordsSchema),
      fetchValidated("/admin/tenant/alltenants", token, tenantsSchema),
      fetchValidated("/admin/staff/allstaff", token, staffSchema),
      fetchValidated("/admin/property/allproperties", token, propertiesSchema),
      fetchValidated("/admin/block/allblocks", token, blocksSchema),
      fetchValidated("/admin/building/allbuildings", token, buildingsSchema),
    ]);

  // 3. DERIVED STATS (computed on the server)
  const pendingComplaints = complaints
    ? complaints.filter((c) => c.status === "PENDING").length
    : 0;
  const resolvedComplaints = complaints
    ? complaints.filter(
        (c) => c.status === "RESOLVED" || c.status === "REJECTED",
      ).length
    : 0;
  const pendingTenants = tenants
    ? tenants.filter((t) => t.status === "PENDING").length
    : 0;

  // Latest announcements (backend returns newest first)
  const latestAnnouncements = announcements ? announcements.slice(0, 3) : [];

  // ---- Render ------------------------------------------------
  return (
    <>
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Monitor properties, people and operational activity from one place."
      />

      {/* Stat cards - live data fetched during SSR */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <AdminCard
          title="Announcements"
          value={announcements ? announcements.length : 0}
          hint="Published to all roles"
          tone="primary"
        />
        <AdminCard
          title="Open Complaints"
          value={pendingComplaints}
          hint={
            complaints
              ? `${resolvedComplaints} closed / ${complaints.length} total`
              : "Backend data unavailable"
          }
          tone="error"
        />
        <AdminCard
          title="Pending Tenants"
          value={pendingTenants}
          hint={tenants ? `${tenants.length} tenants total` : "Backend data unavailable"}
          tone="warning"
        />
        <AdminCard
          title="Properties"
          value={properties ? properties.length : 0}
          hint={
            buildings
              ? `${buildings.length} buildings / ${blocks ? blocks.length : 0} blocks`
              : "Backend data unavailable"
          }
          tone="neutral"
        />
      </div>

      {/* People counts row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <AdminCard
          title="Landlords"
          value={landlords ? landlords.length : 0}
          hint="Managed by admin"
        />
        <AdminCard
          title="Tenants"
          value={tenants ? tenants.length : 0}
          hint="Created by admin, approved by landlord"
        />
        <AdminCard
          title="Staff"
          value={staff ? staff.length : 0}
          hint="Operational team"
        />
      </div>

      {/* Two-column bottom: latest announcements + quick links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card border border-base-300 bg-white shadow-sm lg:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h3 className="card-title text-base">Latest Announcements</h3>
              <Link
                href="/admin/announcements"
                className="text-xs text-dwellix-500 hover:underline"
              >
                Manage all
              </Link>
            </div>

            <div className="mt-2 divide-y divide-base-300">
              {latestAnnouncements.length === 0 && (
                <p className="py-4 text-sm text-gray-500">
                  No announcements published yet.
                </p>
              )}
              {latestAnnouncements.map((announcement) => (
                <div key={announcement.id} className="py-3">
                  <p className="text-sm font-semibold">
                    {announcement.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                    {announcement.body}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    by {announcement.created_by?.name ?? "Admin"} ·{" "}
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">Quick Access</h3>
            <div className="mt-2 grid gap-2">
              <Link
                href="/admin/announcements"
                className="btn btn-sm justify-between border-base-300 bg-base-100 text-gray-700 hover:border-dwellix-500"
              >
                Announcements <span>→</span>
              </Link>
              <Link
                href="/admin/complaints"
                className="btn btn-sm justify-between border-base-300 bg-base-100 text-gray-700 hover:border-dwellix-500"
              >
                Complaint Center <span>→</span>
              </Link>
              <Link
                href="/admin/landlords"
                className="btn btn-sm justify-between border-base-300 bg-base-100 text-gray-700 hover:border-dwellix-500"
              >
                Landlords <span>→</span>
              </Link>
              <Link
                href="/admin/tenants"
                className="btn btn-sm justify-between border-base-300 bg-base-100 text-gray-700 hover:border-dwellix-500"
              >
                Tenants <span>→</span>
              </Link>
              <Link
                href="/admin/staff"
                className="btn btn-sm justify-between border-base-300 bg-base-100 text-gray-700 hover:border-dwellix-500"
              >
                Staff <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
