"use client";

/* ============================================================
   ADMIN STAFF MANAGER — components/admin/AdminStaffManager.tsx
   ------------------------------------------------------------
   Same course concepts as AdminLandlordManager (SSR + CSR
   hybrid, useState, Zod create/update schemas mirroring the
   backend DTOs, axios + NEXT_PUBLIC_API_URL, DaisyUI modal).

   Staff-specific: CreateStaffDto = name/email/phone/password;
   UpdateStaffDto = name/email/phone (no password).
   ============================================================ */

import { useState } from "react";
import axios from "axios";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";
import AdminPeopleTable, { type AdminPeopleRow } from "./AdminPeopleTable";

type StaffMember = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  created_by: { id: number; name: string } | null;
};

/* Zod schemas mirroring CreateStaffDto / UpdateStaffDto. */
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
type FieldErrors = Partial<Record<keyof CreateForm, string>>;

const EMPTY_CREATE: CreateForm = { name: "", email: "", phone: "", password: "" };

export default function AdminStaffManager({
  initialStaff,
}: {
  initialStaff: StaffMember[];
}) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [banner, setBanner] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

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

  function openEditModal(member: StaffMember) {
    setEditingId(member.id);
    setForm({ name: member.name, email: member.email, phone: member.phone, password: "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  async function refresh() {
    const response = await axios.get(
      process.env.NEXT_PUBLIC_API_URL + "/admin/staff/allstaff",
      { headers: authHeader() },
    );
    setStaff(response.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");

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
          process.env.NEXT_PUBLIC_API_URL + "/admin/staff/create",
          result.data,
          { headers: authHeader() },
        );
        setBanner("Staff member created successfully.");
      } else {
        await axios.patch(
          process.env.NEXT_PUBLIC_API_URL + `/admin/staff/update/${editingId}`,
          result.data,
          { headers: authHeader() },
        );
        setBanner("Staff member updated successfully.");
      }

      closeModal();
      await refresh();
      setTimeout(() => setBanner(""), 4000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        setBanner(typeof message === "string" ? message : "Could not save the staff member.");
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
        process.env.NEXT_PUBLIC_API_URL + `/admin/staff/delete/${deleteTarget.id}`,
        { headers: authHeader() },
      );
      setBanner("Staff member deleted.");
      setDeleteTarget(null);
      await refresh();
      setTimeout(() => setBanner(""), 4000);
    } catch {
      setBanner("Could not delete the staff member.");
    } finally {
      setSubmitting(false);
    }
  }

  const rows: AdminPeopleRow[] = staff.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    meta: member.phone,
    status: member.status,
    footer: `Created by ${member.created_by?.name ?? "admin"}`,
    detailHref: `/admin/staff/${member.id}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage staff members and their responsibilities. {staff.length} total.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          + Add Staff
        </button>
      </div>

      {banner && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-success">{banner}</span>
        </div>
      )}

      <AdminPeopleTable
        metaLabel="Phone"
        rows={rows}
        emptyMessage="No staff members created yet."
        onEdit={(row) => {
          const member = staff.find((item) => item.id === row.id);
          if (member) openEditModal(member);
        }}
        onDelete={(row) => {
          const member = staff.find((item) => item.id === row.id);
          if (member) setDeleteTarget(member);
        }}
      />

      {/* Add/Edit modal (Zod-validated) */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="text-lg font-bold">
              {editingId === null ? "Add Staff" : "Edit Staff"}
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
            <h3 className="text-lg font-bold">Delete staff member?</h3>
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
