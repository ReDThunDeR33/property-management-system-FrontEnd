"use client";

/* ============================================================
   ANNOUNCEMENTS PAGE (CSR #1) — pure Tailwind, no DaisyUI
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. CSR (CLIENT-SIDE RENDERING) — course table: "Admin panel
      → CSR". This is a "use client" page: the shell renders
      first, then useState/useEffect load the data in the
      browser after mount via Axios.

   2. React Hooks — useState (list, modal state, form fields,
      errors, banners) + useEffect (fetch list on mount).

   3. ZOD VALIDATION — announcementSchema mirrors the backend
      CreateAnnouncementDto (title required, max 150 chars).
      The form uses noValidate so validation is 100% Zod —
      no vanilla JS / HTML validation (course requirement).

   4. AXIOS ONLY — every request uses axios + the
      NEXT_PUBLIC_API_URL env var and the JWT from the cookie
      (authHeader() — cookie-based authentication flow).

   5. DaisyUI replacement — the table, modal, alert and
      buttons are plain Tailwind utilities (lib/adminUi).
   ============================================================ */

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";
import {
  AdminPageHeader,
  AdminAlert,
  AdminModal,
  AdminBadge,
  Field,
  btnPrimary,
  btnSecondary,
  btnDanger,
  btnGhost,
  inputClass,
  thClass,
  tdClass,
} from "@/lib/adminUi";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/* ---------- Types ---------- */
type Announcement = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  created_by?: { id: number; name: string } | null;
};

/* ---------- Zod schema (mirrors CreateAnnouncementDto) ---------- */
const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title must be 150 characters or fewer"),
  body: z.string().trim().min(1, "Body is required"),
});

type FormState = { title: string; body: string };
const EMPTY_FORM: FormState = { title: "", body: "" };

export default function AnnouncementsPage() {
  /* ---------- React state (hooks) ---------- */
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  /* ---------- Axios GET — load list on mount (useEffect) ---------- */
  const loadAnnouncements = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await axios.get<Announcement[]>(
        `${API}/admin/announcement/allannouncements`,
        { headers: authHeader() },
      );
      setAnnouncements(response.data);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  /* ---------- Modal helpers ---------- */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (announcement: Announcement) => {
    setEditing(announcement);
    setForm({ title: announcement.title, body: announcement.body });
    setErrors({});
    setModalOpen(true);
  };

  /* ---------- Zod validation + Axios POST/PATCH ---------- */
  const handleSubmit = async () => {
    setBanner(null);

    // Zod safeParse — the ONLY validation (frontend course rule)
    const result = announcementSchema.safeParse(form);
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
      if (editing) {
        // Axios PATCH — update existing announcement
        await axios.patch(`${API}/admin/announcement/update/${editing.id}`, result.data, {
          headers: authHeader(),
        });
        setBanner({ kind: "success", text: `Announcement #${editing.id} updated.` });
      } else {
        // Axios POST — create new announcement (also triggers the
        // backend Pusher "new-announcement" real-time event)
        await axios.post(`${API}/admin/announcement/create`, result.data, {
          headers: authHeader(),
        });
        setBanner({ kind: "success", text: "Announcement published." });
      }
      setModalOpen(false);
      await loadAnnouncements();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? "Request failed")
        : "Unexpected error";
      setBanner({ kind: "error", text: String(message) });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Axios DELETE ---------- */
  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await axios.delete(`${API}/admin/announcement/delete/${deleting.id}`, {
        headers: authHeader(),
      });
      setBanner({ kind: "success", text: `Announcement #${deleting.id} deleted.` });
      setDeleting(null);
      await loadAnnouncements();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? "Delete failed")
        : "Unexpected error";
      setBanner({ kind: "error", text: String(message) });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Render (basic, readable JSX) ---------- */
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Announcements"
        subtitle="Publish notices that every role sees instantly (Pusher real-time)."
        action={
          <button type="button" onClick={openCreate} className={btnPrimary}>
            + New Announcement
          </button>
        }
      />

      {banner && <AdminAlert kind={banner.kind}>{banner.text}</AdminAlert>}

      {/* Loading skeleton (while CSR fetch is in flight) */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {/* Backend-down retry state */}
      {!loading && loadFailed && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Cannot reach the backend.</p>
          <button type="button" onClick={loadAnnouncements} className={`${btnSecondary} mt-4`}>
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadFailed && announcements.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No announcements published yet.</p>
          <button type="button" onClick={openCreate} className={`${btnPrimary} mt-4`}>
            Publish the first one
          </button>
        </div>
      )}

      {/* Announcements table (pure Tailwind table) */}
      {!loading && !loadFailed && announcements.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Body</th>
                <th className={thClass}>Published By</th>
                <th className={thClass}>Date</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="transition hover:bg-gray-50">
                  <td className={`${tdClass} font-mono text-xs`}>#{announcement.id}</td>
                  <td className={`${tdClass} font-semibold text-gray-900`}>{announcement.title}</td>
                  <td className={`${tdClass} max-w-xs truncate`}>{announcement.body}</td>
                  <td className={tdClass}>{announcement.created_by?.name ?? "—"}</td>
                  <td className={tdClass}>
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </td>
                  <td className={tdClass}>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(announcement)} className={btnGhost}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(announcement)}
                        className={`${btnGhost} text-red-600 hover:bg-red-50 hover:text-red-700`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal (pure Tailwind dialog) */}
      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Announcement #${editing.id}` : "New Announcement"}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          <Field label="Title" error={errors.title}>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Water Supply Maintenance"
              disabled={submitting}
            />
          </Field>
          <Field label="Body" error={errors.body}>
            <textarea
              className={`${inputClass} min-h-32`}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write the notice details…"
              disabled={submitting}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Saving…" : editing ? "Save Changes" : "Publish"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete confirmation modal */}
      <AdminModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete Announcement"
      >
        <p className="text-sm text-gray-600">
          Delete <strong>“{deleting?.title}”</strong> permanently? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setDeleting(null)} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={submitting} className={btnDanger}>
            {submitting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
