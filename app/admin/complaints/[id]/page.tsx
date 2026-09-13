"use client";

/* ============================================================
   COMPLAINT DETAIL — app/admin/complaints/[id]/page.tsx
   (CSR #3, DYNAMIC ROUTE) — pure Tailwind
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. DYNAMIC ROUTING — the [id] folder makes this ONE page
      render for /admin/complaints/1, /admin/complaints/7, …
      The URL segment is read with the useParams() hook.

   2. CSR — "use client": the complaint is fetched in the
      browser via useEffect + Axios after mount.

   3. ZOD VALIDATION — the Admin Review form uses a schema
      with a refinement: RESOLVED/REJECTED requires an
      inspection note of at least 5 characters. The form is
      noValidate — validation is 100% Zod (course rule).

   4. Axios PATCH — submits the review to
      PATCH /admin/complaint/update/:id with the JWT cookie.
   ============================================================ */

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";
import {
  AdminPageHeader,
  AdminAlert,
  AdminBadge,
  Field,
  btnPrimary,
  btnSecondary,
  inputClass,
} from "@/lib/adminUi";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Complaint = {
  id: number;
  title: string;
  description: string;
  status: string;
  type?: string | null;
  filed_by_id?: number | null;
  admin_note?: string | null;
  reviewed_by?: { id: number; name: string } | null;
  created_at: string;
  updated_at?: string;
};

/* ---------- Zod schema for the review form ---------- */
const reviewSchema = z
  .object({
    status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"]),
    admin_note: z.string().trim().max(1000, "Note is too long (max 1000)"),
  })
  .refine((data) => !["RESOLVED", "REJECTED"].includes(data.status) || data.admin_note.length >= 5, {
    message: "An inspection note (min 5 characters) is required to RESOLVE or REJECT.",
    path: ["admin_note"],
  });

type FormState = { status: string; admin_note: string };

export default function ComplaintDetailPage() {
  /* ---------- dynamic route param (useParams hook) ---------- */
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<FormState>({ status: "IN_PROGRESS", admin_note: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  /* ---------- load the complaint (Axios + cookie JWT) ---------- */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Complaint>(`${API}/admin/complaint/find/${id}`, {
          headers: authHeader(),
        });
        if (cancelled) return;
        if (!response.data || typeof response.data.id !== "number") {
          setMissing(true); // backend returned 404 JSON
        } else {
          setComplaint(response.data);
          setForm({ status: response.data.status, admin_note: response.data.admin_note ?? "" });
        }
      } catch {
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ---------- Zod validation + Axios PATCH review ---------- */
  const handleSubmit = async () => {
    setBanner(null);
    const result = reviewSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.patch<Complaint>(
        `${API}/admin/complaint/update/${id}`,
        result.data,
        { headers: authHeader() },
      );
      setComplaint(response.data);
      setForm({ status: response.data.status, admin_note: response.data.admin_note ?? "" });
      setBanner({ kind: "success", text: `Complaint #${id} review saved.` });
    } catch {
      setBanner({ kind: "error", text: "Could not save the review. Is the backend running?" });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- render states ---------- */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (missing || !complaint) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-5xl font-black text-dwellix-500">404</p>
        <h2 className="mt-3 text-xl font-bold text-gray-900">Complaint not found</h2>
        <p className="mt-2 text-sm text-gray-500">
          Complaint #{id} does not exist or was deleted.
        </p>
        <button type="button" onClick={() => router.push("/admin/complaints")} className={`${btnPrimary} mt-6`}>
          Back to Complaints
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Complaint #${complaint.id}`}
        subtitle={`Filed on ${new Date(complaint.created_at).toLocaleString()}`}
        action={
          <Link href="/admin/complaints" className={btnSecondary}>
            ← All complaints
          </Link>
        }
      />

      {banner && <AdminAlert kind={banner.kind}>{banner.text}</AdminAlert>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: complaint details card */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">{complaint.title}</h2>
            <AdminBadge status={complaint.status} />
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">
            {complaint.description}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Type</dt>
              <dd className="mt-1 text-gray-800">{complaint.type ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Filed by (role id)
              </dt>
              <dd className="mt-1 text-gray-800">{complaint.filed_by_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Reviewed by
              </dt>
              <dd className="mt-1 text-gray-800">{complaint.reviewed_by?.name ?? "Not reviewed yet"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Last update
              </dt>
              <dd className="mt-1 text-gray-800">
                {complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : "—"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Right: admin review form (Zod-validated) */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Admin Review</h2>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="mt-4 space-y-4"
          >
            <Field label="Status" error={errors.status}>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={submitting}
              >
                {["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Inspection note" error={errors.admin_note}>
              <textarea
                className={`${inputClass} min-h-32`}
                placeholder="What did the inspection find? (required to resolve/reject)"
                value={form.admin_note}
                onChange={(e) => setForm({ ...form, admin_note: e.target.value })}
                disabled={submitting}
              />
            </Field>

            <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
              {submitting ? "Saving…" : "Save Review"}
            </button>
          </form>

          <p className="mt-3 text-xs text-gray-400">
            Validated with Zod — RESOLVED/REJECTED requires a note (mirrors the backend DTO).
          </p>
        </section>
      </div>
    </div>
  );
}
