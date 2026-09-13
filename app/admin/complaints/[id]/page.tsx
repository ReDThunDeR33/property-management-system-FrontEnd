"use client";

/* ============================================================
   COMPLAINT DETAIL — app/admin/complaints/[id]/page.tsx
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. DYNAMIC ROUTING — the [id] folder makes this a dynamic
      route: /admin/complaints/3, /admin/complaints/7, ... all
      render this ONE page. Next.js passes the URL segment as
      the `id` param, read with the useParams() hook (Next 15/16
      client-component style).

   2. CSR — "use client": the complaint is fetched from the
      browser after mount (private admin data + interactivity),
      following the course table ("Admin panel -> CSR").

   3. REACT HOOKS:
      - useParams  -> dynamic route parameter (from next/navigation)
      - useEffect  -> loads the complaint once on mount
      - useState   -> complaint data, review form fields,
        submit state, 404 flag

   4. ZOD VALIDATION — the admin's review form (status choice +
      inspection note) is validated with a Zod schema before the
      request. A RESOLVED/REJECTED decision requires a note
      (min 5 chars) — enforced by Zod, not by HTML/vanilla JS.

   5. AXIOS — axios imported directly, backend URL from
      NEXT_PUBLIC_API_URL in .env.local (course convention).
      GET /admin/complaint/find/:id and PATCH
      /admin/complaint/update/:id, JWT attached via
      authHeader(). fetch() is never used.

   6. DAISYUI — badge, select, textarea, alert, btn components.
   ============================================================ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import axios from "axios";
import { authHeader } from "@/lib/getToken";

type Complaint = {
  id: number;
  filed_by_type: string;
  filed_by_id: number;
  against_type: string;
  against_id: number | null;
  description: string;
  status: string;
  admin_note: string | null;
  reviewed_by: { id: number; name: string } | null;
  created_at: string;
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const;
type ReviewStatus = (typeof STATUS_OPTIONS)[number];

/* Zod schema for the admin review form:
   - status must be one of the four backend enum values
   - a decision (RESOLVED / REJECTED) requires an inspection note */
const reviewSchema = z
  .object({
    status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"], {
      message: "Please choose a valid status",
    }),
    admin_note: z.string().max(1000, "Note is too long (max 1000 characters)"),
  })
  .refine(
    (data) =>
      !(data.status === "RESOLVED" || data.status === "REJECTED") ||
      data.admin_note.trim().length >= 5,
    {
      message:
        "An inspection note (min 5 characters) is required when resolving or rejecting",
      path: ["admin_note"],
    },
  );

type ReviewForm = z.infer<typeof reviewSchema>;

export default function ComplaintDetailPage() {
  // Dynamic route parameter: /admin/complaints/[id]
  const params = useParams();
  const complaintId = params?.id;

  const router = useRouter();

  // ----- state (all browser-side — CSR) -----
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ status?: string; admin_note?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState("");

  /* useEffect: load this complaint once on mount using the
     dynamic [id] parameter. */
  useEffect(() => {
    if (!complaintId) return;
    fetchComplaint(String(complaintId));
  }, [complaintId]);

  // Axios GET /admin/complaint/find/:id (JWT protected).
  async function fetchComplaint(id: string) {
    try {
      setLoading(true);
      setNotFound(false);

      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/complaint/find/${id}`,
        { headers: authHeader() },
      );

      setComplaint(response.data);
      // pre-fill the review form with the current values
      setStatus(response.data.status);
      setNote(response.data.admin_note ?? "");
    } catch (error) {
      // 404 -> invalid id -> show the not-found view
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  /* Submit the admin review: Zod validates the form first,
     then Axios PATCH /admin/complaint/update/:id records the
     new status + admin note (reviewed_by is set by the backend
     from the JWT). */
  async function handleReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");

    // ---- Zod validation (frontend validation only) ----
    const formData: ReviewForm = { status, admin_note: note };
    const result = reviewSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: { status?: string; admin_note?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof newErrors;
        if (field) newErrors[field] = issue.message;
      });
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});

    // ---- validated -> Axios PATCH ----
    try {
      setSubmitting(true);

      await axios.patch(
        process.env.NEXT_PUBLIC_API_URL + `/admin/complaint/update/${complaintId}`,
        { status: result.data.status, admin_note: result.data.admin_note.trim() },
        { headers: authHeader() },
      );

      setBanner(`Complaint marked as ${result.data.status}.`);
      await fetchComplaint(String(complaintId)); // reload fresh data
      setTimeout(() => setBanner(""), 4000);
    } catch {
      setBanner("Could not update the complaint. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  // ----- loading view -----
  if (loading) {
    return (
      <div className="card mx-auto max-w-2xl border border-base-300 bg-white shadow-sm">
        <div className="card-body space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-base-300" />
          <div className="h-4 w-full animate-pulse rounded bg-base-300" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-base-300" />
        </div>
      </div>
    );
  }

  // ----- invalid id -> not-found view -----
  if (notFound || !complaint) {
    return (
      <div className="card mx-auto max-w-md border border-base-300 bg-white shadow-sm">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-xl">Complaint not found</h2>
          <p className="text-sm text-gray-500">
            Complaint #{complaintId} does not exist (or was deleted).
          </p>
          <Link href="/admin/complaints" className="btn btn-primary btn-sm mt-3">
            Back to Complaint Center
          </Link>
        </div>
      </div>
    );
  }

  // ----- detail view (basic JSX) -----
  return (
    <div className="space-y-6">
      {/* Breadcrumb back to the list */}
      <Link href="/admin/complaints" className="text-sm text-dwellix-500 hover:underline">
        ← Back to Complaint Center
      </Link>

      {banner && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-success">{banner}</span>
        </div>
      )}

      {/* Complaint info card */}
      <div className="card border border-base-300 bg-white shadow-sm">
        <div className="card-body space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold">Complaint #{complaint.id}</h1>
            <span className="badge badge-warning">{complaint.status}</span>
          </div>

          <p className="whitespace-pre-line text-sm leading-6">
            {complaint.description}
          </p>

          <div className="grid gap-4 border-t border-base-300 pt-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-gray-400">Filed by</p>
              <p className="font-semibold">
                {complaint.filed_by_type} #{complaint.filed_by_id}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Against</p>
              <p className="font-semibold">
                {complaint.against_type}
                {complaint.against_id ? ` #${complaint.against_id}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Filed on</p>
              <p>{new Date(complaint.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Reviewed by</p>
              <p>
                {complaint.reviewed_by
                  ? `${complaint.reviewed_by.name} (admin #${complaint.reviewed_by.id})`
                  : "Not reviewed yet"}
              </p>
            </div>
          </div>

          {complaint.admin_note && (
            <div className="rounded border border-base-300 bg-base-200 p-4">
              <p className="text-xs uppercase text-gray-400">Current admin note</p>
              <p className="mt-1 whitespace-pre-line text-sm">
                {complaint.admin_note}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin review form (Zod-validated, Axios PATCH) */}
      <div className="card border border-base-300 bg-white shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base">Admin Review</h2>
          <p className="text-xs text-gray-500">
            Decide the outcome and record your inspection note.
          </p>

          <form onSubmit={handleReview} noValidate className="mt-2 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Status
              </label>
              <select
                className="select select-bordered w-full max-w-xs"
                value={status}
                onChange={(event) => setStatus(event.target.value as ReviewStatus)}
                disabled={submitting}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.status && (
                <p className="mt-1 text-xs text-error">{fieldErrors.status}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Inspection note (required for RESOLVED / REJECTED)
              </label>
              <textarea
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. Investigated with the landlord; payment issue resolved on 12 Sep."
                className="textarea textarea-bordered w-full"
                disabled={submitting}
              />
              {fieldErrors.admin_note && (
                <p className="mt-1 text-xs text-error">{fieldErrors.admin_note}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? "Saving..." : "Save review"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => router.push("/admin/complaints")}
                disabled={submitting}
              >
                Back to list
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
