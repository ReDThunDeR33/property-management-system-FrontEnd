"use client";

/* ============================================================
   ADMIN LANDLORD MANAGER — components/admin/AdminLandlordManager.tsx
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. SSR + CSR HYBRID — course table:
      "Personalized dashboard -> SSR or SSR + CSR".
      The PAGE (app/admin/landlords/page.tsx) is a Server
      Component: it reads the admin's JWT cookie, fetches the
      list with Axios and hands the validated data DOWN to this
      client component as the `initialLandlords` prop. This
      component then handles all INTERACTIVITY in the browser:
      Add / Edit / Delete operations.

   2. REACT HOOKS — useState (modal/form state, list) +
      useEffect is not needed for the initial load (the SSR
      data arrives via props) but the list refreshes with new
      Axios calls after each operation.

   3. ZOD VALIDATION — the Add/Edit form uses two Zod schemas:
      createSchema (password required, min 4) and
      updateSchema (no password) — mirroring the backend DTOs
      (CreateLandlordDto / UpdateLandlordDto) exactly.
      No vanilla or HTML validation.

   4. AXIOS (course convention) — axios direct +
      process.env.NEXT_PUBLIC_API_URL from .env.local:
      POST   /admin/landlord/create
      PATCH  /admin/landlord/update/:id
      DELETE /admin/landlord/delete/:id
      fetch() is never used.

   5. DAISYUI — modal, input, alert, btn (table comes from the
      reusable AdminPeopleTable component).
   ============================================================ */

import { useState } from "react";
import axios from "axios";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";
import AdminPeopleTable, { type AdminPeopleRow } from "./AdminPeopleTable";

// The props type mirrors the SSR data layer's AdminPerson shape.
type Landlord = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  created_by: { id: number; name: string } | null;
};

/* ---- Zod schemas (mirror the backend DTOs) ---- */
const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;
type FieldErrors = Partial<Record<keyof CreateForm, string>>;

const EMPTY_CREATE: CreateForm = { name: "", email: "", phone: "", password: "" };

export default function AdminLandlordManager({
  initialLandlords,
}: {
  initialLandlords: Landlord[];
}) {
  // List state — seeded from the SSR data (props down).
  const [landlords, setLandlords] = useState<Landlord[]>(initialLandlords);
  const [banner, setBanner] = useState("");

  // Modal + form state.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Landlord | null>(null);

  // Controlled inputs (useState).
  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_CREATE);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEditModal(landlord: Landlord) {
    setEditingId(landlord.id);
    setForm({ name: landlord.name, email: landlord.email, phone: landlord.phone, password: "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  // Reload the list from the backend after any mutation.
  async function refresh() {
    const response = await axios.get(
      process.env.NEXT_PUBLIC_API_URL + "/admin/landlord/alllandlord",
      { headers: authHeader() },
    );
    setLandlords(response.data);
  }

  /* Zod validates first (create vs update schema), then Axios. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");

    // Choose the schema: create needs a password, update does not.
    const schema = editingId === null ? createSchema : updateSchema;
    const result = schema.safeParse(form);

    if (!result.success) {
      const newErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateForm;
        if (field && !newErrors[field]) newErrors[field] = issue.message;
      });
      setFieldErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setFieldErrors({});

      if (editingId === null) {
        await axios.post(
          process.env.NEXT_PUBLIC_API_URL + "/admin/landlord/create",
          result.data,
          { headers: authHeader() },
        );
        setBanner("Landlord created successfully.");
      } else {
        await axios.patch(
          process.env.NEXT_PUBLIC_API_URL + `/admin/landlord/update/${editingId}`,
          result.data,
          { headers: authHeader() },
        );
        setBanner("Landlord updated successfully.");
      }

      closeModal();
      await refresh();
      setTimeout(() => setBanner(""), 4000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        setBanner(typeof message === "string" ? message : "Could not save the landlord.");
      } else {
        setBanner("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await axios.delete(
        process.env.NEXT_PUBLIC_API_URL + `/admin/landlord/delete/${deleteTarget.id}`,
        { headers: authHeader() },
      );
      setBanner("Landlord deleted.");
      setDeleteTarget(null);
      await refresh();
      setTimeout(() => setBanner(""), 4000);
    } catch {
      setBanner("Could not delete the landlord (they may still own properties).");
    } finally {
      setSubmitting(false);
    }
  }

  // Map API data -> table rows (props for AdminPeopleTable).
  const rows: AdminPeopleRow[] = landlords.map((landlord) => ({
    id: landlord.id,
    name: landlord.name,
    email: landlord.email,
    meta: landlord.phone,
    status: landlord.status,
    footer: `Created by ${landlord.created_by?.name ?? "admin"}`,
    detailHref: `/admin/landlords/${landlord.id}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header with the Add button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landlord Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage owners and their property portfolios. {landlords.length} total.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          + Add Landlord
        </button>
      </div>

      {banner && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-success">{banner}</span>
        </div>
      )}

      {/* Reusable table, now with Edit/Delete handlers via props */}
      <AdminPeopleTable
        metaLabel="Phone"
        rows={rows}
        emptyMessage="No landlords created yet."
        onEdit={(row) => {
          const landlord = landlords.find((item) => item.id === row.id);
          if (landlord) openEditModal(landlord);
        }}
        onDelete={(row) => {
          const landlord = landlords.find((item) => item.id === row.id);
          if (landlord) setDeleteTarget(landlord);
        }}
      />

      {/* Add/Edit modal (Zod-validated) */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="text-lg font-bold">
              {editingId === null ? "Add Landlord" : "Edit Landlord"}
            </h3>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  disabled={submitting}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  disabled={submitting}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  disabled={submitting}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password only on CREATE (mirrors the backend DTOs) */}
              {editingId === null && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Password (min 4 characters)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    disabled={submitting}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.password}</p>
                  )}
                </div>
              )}

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
                  {submitting ? "Saving..." : editingId === null ? "Create" : "Save changes"}
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
            <h3 className="text-lg font-bold">Delete landlord?</h3>
            <p className="mt-2 text-sm text-gray-500">
              &quot;{deleteTarget.name}&quot; will be removed permanently.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteTarget(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button className="btn btn-error btn-sm" onClick={handleDelete} disabled={submitting}>
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
