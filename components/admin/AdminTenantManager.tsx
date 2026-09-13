"use client";

/* ============================================================
   ADMIN TENANT MANAGER (client component) — pure Tailwind
   ------------------------------------------------------------
   Full CRUD for tenants. Mirrors CreateTenantDto (name, email,
   phone, password, nid_number, nid_document_url, has_vehicle)
   and UpdateTenantDto (no password). Zod url() check on the
   NID document link. Tenants are created PENDING — the
   landlord approves them later (as per the workflow).
   ============================================================ */

import { useState } from "react";
import axios from "axios";
import { z } from "zod";
import type { Tenant } from "@/lib/adminPeople";
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
} from "@/lib/adminUi";
import AdminPeopleTable from "./AdminPeopleTable";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/* ---------- Zod schemas (mirror the backend DTOs) ---------- */
const createTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(1, "Phone is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  nid_number: z.string().trim().min(1, "NID number is required"),
  nid_document_url: z.string().trim().url("Enter a valid document URL (https://…)"),
  has_vehicle: z.boolean(),
});

const updateTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(1, "Phone is required"),
  nid_number: z.string().trim().min(1, "NID number is required"),
  // Optional on update (list endpoint doesn't return the URL)
  nid_document_url: z
    .string()
    .trim()
    .url("Enter a valid document URL (https://…)")
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  nid_number: string;
  nid_document_url: string;
  has_vehicle: boolean;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  nid_number: "",
  nid_document_url: "",
  has_vehicle: false,
};

export default function AdminTenantManager({ tenants }: { tenants: Tenant[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState<Tenant | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditing(tenant);
    setForm({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      password: "",
      nid_number: tenant.nid_number,
      nid_document_url: "", // not returned by the list endpoint
      has_vehicle: tenant.has_vehicle,
    });
    setErrors({});
    setModalOpen(true);
  };

  /* ---------- Zod validate + Axios POST/PATCH ---------- */
  const handleSubmit = async () => {
    setBanner(null);

    const payload = editing
      ? {
          name: form.name,
          email: form.email,
          phone: form.phone,
          nid_number: form.nid_number,
          nid_document_url: form.nid_document_url,
        }
      : form;

    const schema = editing ? updateTenantSchema : createTenantSchema;
    const result = schema.safeParse(payload);
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
        await axios.patch(`${API}/admin/tenant/update/${editing.id}`, result.data, {
          headers: authHeader(),
        });
        setBanner({ kind: "success", text: `Tenant #${editing.id} updated — refreshing…` });
      } else {
        await axios.post(`${API}/admin/tenant/create`, result.data, { headers: authHeader() });
        setBanner({ kind: "success", text: "Tenant created (status PENDING) — refreshing…" });
      }
      setModalOpen(false);
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? "Request failed")
        : "Unexpected error";
      setBanner({ kind: "error", text: String(message) });
      setSubmitting(false);
    }
  };

  /* ---------- Axios DELETE ---------- */
  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await axios.delete(`${API}/admin/tenant/delete/${deleting.id}`, { headers: authHeader() });
      setBanner({ kind: "success", text: `Tenant #${deleting.id} deleted — refreshing…` });
      setDeleting(null);
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? "Delete failed")
        : "Unexpected error";
      setBanner({ kind: "error", text: String(message) });
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tenants"
        subtitle="Residents created by the admin — landlords approve them afterwards."
        action={
          <button type="button" onClick={openCreate} className={btnPrimary}>
            + Add Tenant
          </button>
        }
      />

      {banner && <AdminAlert kind={banner.kind}>{banner.text}</AdminAlert>}

      <AdminPeopleTable
        columns={["#", "Name", "Email", "Phone", "NID Number", "Vehicle", "Status", "Property"]}
        rows={tenants}
        getRowKey={(row) => (row as Tenant).id}
        onEdit={openEdit}
        onDelete={(row) => setDeleting(row as Tenant)}
        emptyMessage="No tenants yet."
        renderRow={(row) => {
          const tenant = row as Tenant;
          return (
            <>
              <td className="px-4 py-3 text-sm font-mono text-xs text-gray-500">#{tenant.id}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{tenant.name}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{tenant.email}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{tenant.phone}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{tenant.nid_number}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{tenant.has_vehicle ? "Yes" : "No"}</td>
              <td className="px-4 py-3">
                <AdminBadge status={tenant.status ?? "PENDING"} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {tenant.property ? `Unit ${tenant.property.unit_number ?? tenant.property.id}` : "—"}
              </td>
            </>
          );
        }}
      />

      {/* Create / Edit modal */}
      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Tenant #${editing.id}` : "Add Tenant"}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          <Field label="Name" error={errors.name}>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={submitting}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={submitting}
            />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={submitting}
            />
          </Field>
          {!editing && (
            <Field label="Password" error={errors.password}>
              <input
                type="password"
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={submitting}
              />
            </Field>
          )}
          <Field label="NID Number" error={errors.nid_number}>
            <input
              className={inputClass}
              value={form.nid_number}
              onChange={(e) => setForm({ ...form, nid_number: e.target.value })}
              disabled={submitting}
            />
          </Field>
          <Field
            label={editing ? "NID Document URL (leave empty to keep current)" : "NID Document URL"}
            error={errors.nid_document_url}
          >
            <input
              className={inputClass}
              placeholder="https://example.com/nid.pdf"
              value={form.nid_document_url}
              onChange={(e) => setForm({ ...form, nid_document_url: e.target.value })}
              disabled={submitting}
            />
          </Field>

          {/* Checkbox — has_vehicle (CreateTenantDto requires boolean) */}
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-dwellix-600 focus:ring-dwellix-500"
              checked={form.has_vehicle}
              onChange={(e) => setForm({ ...form, has_vehicle: e.target.checked })}
              disabled={submitting || editing !== null}
            />
            Has vehicle
            {editing && <span className="text-xs text-gray-400">(not editable after create)</span>}
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Saving…" : editing ? "Save Changes" : "Create Tenant"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete confirmation */}
      <AdminModal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete Tenant">
        <p className="text-sm text-gray-600">
          Delete <strong>{deleting?.name}</strong> permanently? This cannot be undone.
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
