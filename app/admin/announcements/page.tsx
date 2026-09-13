"use client";

/* ============================================================
   ADMIN ANNOUNCEMENTS PAGE — app/admin/announcements/page.tsx
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. CLIENT-SIDE RENDERING (CSR) — course table:
      "Admin panel -> CSR" and "Search page with filters -> CSR".
      "use client" makes this a Client Component: it renders in
      the browser, holds local UI state, and talks to the
      backend AFTER the page has loaded. CSR is the right fit
      here because this page is highly interactive (create /
      edit / delete forms, modals, live list refresh) and all
      of its data is private admin data that must never be
      pre-rendered into public HTML.

   2. REACT HOOKS:
      - useState  -> every piece of UI state (list, modal,
        form fields, errors, loading flags...)
      - useEffect -> loads the announcement list from the
        backend once when the page mounts ([] dependency).

   3. ZOD VALIDATION (course: Zod.docx) — the create/edit form
      is validated with a Zod schema via safeParse BEFORE any
      request is sent. No vanilla JS validation and no HTML
      form validation is used — errors come from Zod and are
      shown under each field.

   4. AXIOS (course: Axios.pptx) — axios is imported directly
      and the backend URL comes from NEXT_PUBLIC_API_URL in
      .env.local (course convention:
      axios.post(process.env.NEXT_PUBLIC_API_URL + "/route")).
      GET / POST / PATCH / DELETE are all covered, with the
      admin's JWT attached from the cookie (lib/getToken.ts
      authHeader). fetch() is never used.

   5. DAISYUI — table, modal, btn, alert, textarea components.

   6. FOLDER-BASED ROUTING — this file is
      app/admin/announcements/page.tsx -> route /admin/announcements.
   ============================================================ */

import { useEffect, useState } from "react";
import { z } from "zod";
import axios from "axios";
import { authHeader } from "@/lib/getToken";

// The shape of one announcement as returned by the backend.
type Announcement = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  created_by: { id: number; name: string } | null;
};

/* ---- Zod schema for the announcement form (frontend validation) ----
   Mirrors the backend DTO rules (title required, max 150 chars). */
const announcementSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(150, "Title must be at most 150 characters"),
  body: z.string().min(1, "Body is required"),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;
type FieldErrors = Partial<Record<keyof AnnouncementForm, string>>;

export default function AdminAnnouncementsPage() {
  // ----- list state (loaded with useEffect on mount) -----
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  // ----- create/edit modal state -----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnouncementForm>({ title: "", body: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // ----- delete confirmation state -----
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ----- success banner state -----
  const [banner, setBanner] = useState("");

  /* useEffect: fetch the list once when the page mounts.
     This is the CSR data-loading pattern (browser -> backend). */
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Axios GET — loads all announcements (JWT protected route).
  async function fetchAnnouncements() {
    try {
      setLoadingList(true);
      setListError("");

      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/announcement/allannouncements",
        { headers: authHeader() },
      );

      setAnnouncements(response.data);
    } catch (error) {
      setListError("Could not load announcements. Is the backend running?");
    } finally {
      setLoadingList(false);
    }
  }

  // Open the empty modal for creating a new announcement.
  function openCreateModal() {
    setEditingId(null);
    setForm({ title: "", body: "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  // Open the modal pre-filled for editing an existing announcement.
  function openEditModal(announcement: Announcement) {
    setEditingId(announcement.id);
    setForm({ title: announcement.title, body: announcement.body });
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  // Controlled inputs: one handler updates the form state (useState).
  function handleInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  /* Form submit: Zod validates first (safeParse). If invalid we show
     Zod's messages under the fields and never contact the backend.
     If valid -> Axios POST (create) or PATCH (update). */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");

    // ---- Zod validation (no vanilla/HTML validation used) ----
    const result = announcementSchema.safeParse(form);

    if (!result.success) {
      const newErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AnnouncementForm;
        newErrors[field] = issue.message;
      });
      setFieldErrors(newErrors);
      return;
    }

    // ---- validated -> send with Axios ----
    try {
      setSubmitting(true);
      setFieldErrors({});

      if (editingId === null) {
        // CREATE
        await axios.post(
          process.env.NEXT_PUBLIC_API_URL + "/admin/announcement/create",
          result.data,
          { headers: authHeader() },
        );
        setBanner("Announcement published successfully.");
      } else {
        // UPDATE
        await axios.patch(
          process.env.NEXT_PUBLIC_API_URL + `/admin/announcement/update/${editingId}`,
          result.data,
          { headers: authHeader() },
        );
        setBanner("Announcement updated successfully.");
      }

      closeModal();
      await fetchAnnouncements(); // refresh the list (CSR re-fetch)

      // hide the success banner after a moment (browser-side UI state)
      setTimeout(() => setBanner(""), 4000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        setFieldErrors({
          title:
            typeof message === "string" && message.toLowerCase().includes("title")
              ? message
              : undefined,
          body: undefined,
        });
        if (!(typeof message === "string" && message.toLowerCase().includes("title"))) {
          setBanner(
            typeof message === "string"
              ? message
              : "Could not save the announcement."
          );
        }
      } else {
        setBanner("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Axios DELETE after the confirmation modal is accepted.
  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await axios.delete(
        process.env.NEXT_PUBLIC_API_URL + `/admin/announcement/delete/${deleteTarget.id}`,
        { headers: authHeader() },
      );

      setBanner("Announcement deleted.");
      setDeleteTarget(null);
      await fetchAnnouncements();
      setTimeout(() => setBanner(""), 4000);
    } catch (error) {
      setBanner("Could not delete the announcement.");
    } finally {
      setDeleting(false);
    }
  }

  // ---- render (basic JSX) ------------------------------------
  return (
    <div className="space-y-6">
      {/* Page header row with the create button (opens the modal) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">
            Publish important messages to your community. {announcements.length} total.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          + New Announcement
        </button>
      </div>

      {/* Success banner (useState-driven) */}
      {banner && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-success">{banner}</span>
        </div>
      )}

      {/* List area: loading / error / table / empty state */}
      {loadingList ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body">
            <div className="h-4 w-40 animate-pulse rounded bg-base-300" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-base-300" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-base-300" />
          </div>
        </div>
      ) : listError ? (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-error">{listError}</span>
          <button className="btn btn-xs" onClick={fetchAnnouncements}>
            Retry
          </button>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body items-center text-center">
            <p className="text-sm text-gray-500">No announcements published yet.</p>
            <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
              Publish the first one
            </button>
          </div>
        </div>
      ) : (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            {/* DaisyUI table */}
            <table className="table">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th>Title</th>
                  <th>Message</th>
                  <th>Published</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td className="font-semibold">{announcement.title}</td>
                    <td className="max-w-sm">
                      <p className="line-clamp-2 text-sm text-gray-500">
                        {announcement.body}
                      </p>
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(announcement.created_at).toLocaleDateString()}
                      <br />
                      <span className="text-gray-400">
                        by {announcement.created_by?.name ?? "Admin"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEditModal(announcement)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteTarget(announcement)}
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
        </div>
      )}

      {/* Create/Edit modal (DaisyUI modal, state-controlled) */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">
              {editingId === null ? "New Announcement" : "Edit Announcement"}
            </h3>

            {/* Zod-validated form (noValidate: validation is done by
                Zod in handleSubmit, NOT by the browser) */}
            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Water supply maintenance on Friday"
                  className="input input-bordered w-full"
                  disabled={submitting}
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Message
                </label>
                <textarea
                  name="body"
                  value={form.body}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Write the announcement details..."
                  className="textarea textarea-bordered w-full"
                  disabled={submitting}
                />
                {fieldErrors.body && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.body}</p>
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingId === null
                      ? "Publish"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="text-lg font-bold">Delete announcement?</h3>
            <p className="mt-2 text-sm text-gray-500">
              &quot;{deleteTarget.title}&quot; will be removed permanently.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
