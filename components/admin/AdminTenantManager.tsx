"use client";

/* ============================================================
   ADMIN TENANT MANAGER — components/admin/AdminTenantManager.tsx
   ------------------------------------------------------------
   Same course concepts as AdminLandlordManager (SSR + CSR
   hybrid, useState, Zod schemas mirroring the backend DTOs,
   axios + NEXT_PUBLIC_API_URL, DaisyUI modal).

   Tenant-specific (CreateTenantDto):
   name, email, phone, password (min 4), nid_number,
   nid_document_url, has_vehicle (boolean checkbox).
   UpdateTenantDto has no password.
   ============================================================ */

import { useState } from "react";
import axios from "axios";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";
import AdminPeopleTable, { type AdminPeopleRow } from "./AdminPeopleTable";

type Tenant = {
  id: number;
  name: string;
  email: string;
  phone: string;
  nid_number: string;
  has_vehicle: boolean;
  status: string;
  created_at: string;
  property: { id: number; unit_number: string } | null;
  approved_by: { id: number; name: string } | null;
};

/* Zod schemas mirroring CreateTenantDto / UpdateTenantDto. */
const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  nid_number: z.string().min(1, "NID number is required"),
  nid_document_url: z
    .string()
    .min(1, "NID document URL is required")
    .url("Enter a valid URL (https://...)"),
  has_vehicle: z.boolean(),
});

/* Update schema: nid_document_url is OPTIONAL (matches
   UpdateTenantDto). The list endpoint does not return the URL,
   so on edit the field starts empty — if left empty it is
   simply omitted from the PATCH payload ("" -> removed). */
const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  nid_number: z.string().min(1, "NID number is required"),
  nid_document_url: z
    .union([z.literal(""), z.string().url("Enter a valid URL (https://...)")])
    .optional(),
  has_vehicle: z.boolean(),
});

type CreateForm = z.infer<typeof createSchema>;
type FieldErrors = Partial<Record<keyof CreateForm, string>>;

const EMPTY_CREATE: CreateForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  nid_number: "",
  nid_document_url: "",
  has_vehicle: false,
};

export default function AdminTenantManager({
  initialTenants,
}: {
  initialTenants: Tenant[];
}) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [banner, setBanner] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);

  // Controlled text inputs.
  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  // Separate handler for the has_vehicle checkbox (boolean).
  function handleVehicleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setForm((previous) => ({ ...previous, has_vehicle: event.target.checked }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_CREATE);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEditModal(tenant: Tenant) {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      password: "",
      nid_number: tenant.nid_number,
      nid_document_url: "",
      has_vehicle: tenant.has_vehicle,
    });
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
      process.env.NEXT_PUBLIC_API_URL + "/admin/tenant/alltenants",
      { headers: authHeader() },
    );
    setTenants(response.data);
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
          process.env.NEXT_PUBLIC_API_URL + "/admin/tenant/create",
          result.data,
          { headers: authHeader() },
        );
        setBanner("Tenant created successfully (status: PENDING until a landlord approves).");
      } else {
        // UPDATE: omit nid_document_url when left empty
        const payload = { ...result.data };
        if (!payload.nid_document_url) {
          delete payload.nid_document_url;
        }
        await axios.patch(
          process.env.NEXT_PUBLIC_API_URL + `/admin/tenant/update/${editingId}`,
          payload,
          { headers: authHeader() },
        );
        setBanner("Tenant updated successfully.");
      }

      closeModal();
      await refresh();
      setTimeout(() => setBanner(""), 4000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        setBanner(typeof message === "string" ? message : "Could not save the tenant.");
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
        process.env.NEXT_PUBLIC_API_URL + `/admin/tenant/delete/${deleteTarget.id}`,
        { headers: authHeader() },
      );
      setBanner("Tenant deleted.");
      setDeleteTarget(null);
      await refresh();
      setTimeout(() => setBanner(""), 4000);
    } catch {
      setBanner("Could not delete the tenant.");
    } finally {
      setSubmitting(false);
    }
  }

  const rows: AdminPeopleRow[] = tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    meta: `NID ${tenant.nid_number}`,
    status: tenant.status,
    footer: tenant.property
      ? `Unit ${tenant.property.unit_number} · vehicle: ${tenant.has_vehicle ? "yes" : "no"}`
      : `No property yet · vehicle: ${tenant.has_vehicle ? "yes" : "no"}`,
    detailHref: `/admin/tenants/${tenant.id}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenant Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage tenant accounts and property occupancy. {tenants.length} total.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          + Add Tenant
        </button>
      </div>

      {banner && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-success">{banner}</span>
        </div>
      )}

      <AdminPeopleTable
        metaLabel="NID"
        rows={rows}
        emptyMessage="No tenants created yet."
        onEdit={(row) => {
          const tenant = tenants.find((item) => item.id === row.id);
          if (tenant) openEditModal(tenant);
        }}
        onDelete={(row) => {
          const tenant = tenants.find((item) => item.id === row.id);
          if (tenant) setDeleteTarget(tenant);
        }}
      />

      {/* Add/Edit modal (Zod-validated) */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="text-lg font-bold">
              {editingId === null ? "Add Tenant" : "Edit Tenant"}
            </h3>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    NID number
                  </label>
                  <input
                    type="text"
                    name="nid_number"
                    value={form.nid_number}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    disabled={submitting}
                  />
                  {fieldErrors.nid_number && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.nid_number}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    NID document URL
                  </label>
                  <input
                    type="url"
                    name="nid_document_url"
                    value={form.nid_document_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/nid.pdf"
                    className="input input-bordered w-full"
                    disabled={submitting}
                  />
                  {fieldErrors.nid_document_url && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.nid_document_url}</p>
                  )}
                </div>
              </div>

              {/* Boolean checkbox (has_vehicle) */}
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={form.has_vehicle}
                  onChange={handleVehicleChange}
                  disabled={submitting}
                />
                <span className="text-xs font-semibold text-gray-600">
                  Has a vehicle
                </span>
              </label>

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
            <h3 className="text-lg font-bold">Delete tenant?</h3>
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
