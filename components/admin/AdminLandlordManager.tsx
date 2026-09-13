"use client";


import { useState } from "react";
import axios from "axios";
import { z } from "zod";
import type { Landlord } from "@/lib/adminPeople";
import { authHeader } from "@/lib/getToken";
import {
  AdminPageHeader,
  AdminAlert,
  AdminModal,
  Field,
  btnPrimary,
  btnSecondary,
  btnDanger,
  inputClass,
} from "@/lib/adminUi";
import AdminPeopleTable from "./AdminPeopleTable";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const createLandlordSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(1, "Phone is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

const updateLandlordSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(1, "Phone is required"),
});

type FormState = { name: string; email: string; phone: string; password: string };
const EMPTY: FormState = { name: "", email: "", phone: "", password: "" };

export default function AdminLandlordManager({ landlords }: { landlords: Landlord[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Landlord | null>(null);
  const [deleting, setDeleting] = useState<Landlord | null>(null);
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

  const openEdit = (landlord: Landlord) => {
    setEditing(landlord);
    setForm({ name: landlord.name, email: landlord.email, phone: landlord.phone, password: "" });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setBanner(null);

    const schema = editing ? updateLandlordSchema : createLandlordSchema;
    const result = schema.safeParse(editing ? { ...form, password: undefined } : form);
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
        await axios.patch(`${API}/admin/landlord/update/${editing.id}`, result.data, {
          headers: authHeader(),
        });
        setBanner({ kind: "success", text: `Landlord #${editing.id} updated — refreshing…` });
      } else {
        await axios.post(`${API}/admin/landlord/create`, result.data, { headers: authHeader() });
        setBanner({ kind: "success", text: "Landlord created — refreshing…" });
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

  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await axios.delete(`${API}/admin/landlord/delete/${deleting.id}`, { headers: authHeader() });
      setBanner({ kind: "success", text: `Landlord #${deleting.id} deleted — refreshing…` });
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
        title="Landlords"
        subtitle="Property owners created by the admin."
        action={
          <button type="button" onClick={openCreate} className={btnPrimary}>
            + Add Landlord
          </button>
        }
      />

      {banner && <AdminAlert kind={banner.kind}>{banner.text}</AdminAlert>}

      <AdminPeopleTable
        columns={["#", "Name", "Email", "Phone", "Status", "Property"]}
        rows={landlords}
        getRowKey={(row) => (row as Landlord).id}
        onEdit={openEdit}
        onDelete={(row) => setDeleting(row as Landlord)}
        emptyMessage="No landlords yet."
        renderRow={(row) => {
          const landlord = row as Landlord;
          return (
            <>
              <td className="px-4 py-3 text-sm font-mono text-xs text-gray-500">#{landlord.id}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{landlord.name}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{landlord.email}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{landlord.phone}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  {landlord.status ?? "active"}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {landlord.property ? `Unit ${landlord.property.unit_number ?? landlord.property.id}` : "—"}
              </td>
            </>
          );
        }}
      />

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Landlord #${editing.id}` : "Add Landlord"}
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
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Saving…" : editing ? "Save Changes" : "Create Landlord"}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete Landlord"
      >
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
