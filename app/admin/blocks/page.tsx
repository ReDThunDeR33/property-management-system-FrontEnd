"use client";

/* ============================================================
   BLOCKS PAGE (CSR) — pure Tailwind
   ------------------------------------------------------------
   Course concepts: CSR ("Admin panel → CSR"), useState +
   useEffect, Zod validation (mirrors CreateBlockDto), Axios
   direct + NEXT_PUBLIC_API_URL with cookie JWT, pure Tailwind
   table/modal/alert (DaisyUI removed).
   ============================================================ */

import { useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";
import {
  AdminPageHeader,
  AdminAlert,
  AdminModal,
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

type Block = {
  id: number;
  name: string;
  address: string;
  created_at: string;
  created_by?: { id: number; name: string } | null;
};

/* ---------- Zod schema (mirrors CreateBlockDto) ---------- */
const blockSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  address: z.string().trim().min(1, "Address is required").max(255, "Max 255 characters"),
});

type FormState = { name: string; address: string };
const EMPTY: FormState = { name: "", address: "" };

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Block | null>(null);
  const [deleting, setDeleting] = useState<Block | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  /* ---------- Axios GET (useEffect on mount) ---------- */
  const loadBlocks = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await axios.get<Block[]>(`${API}/admin/block/allblocks`, {
        headers: authHeader(),
      });
      setBlocks(response.data);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (block: Block) => {
    setEditing(block);
    setForm({ name: block.name, address: block.address });
    setErrors({});
    setModalOpen(true);
  };

  /* ---------- Zod + Axios POST/PATCH ---------- */
  const handleSubmit = async () => {
    setBanner(null);
    const result = blockSchema.safeParse(form);
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
        await axios.patch(`${API}/admin/block/update/${editing.id}`, result.data, {
          headers: authHeader(),
        });
        setBanner({ kind: "success", text: `Block #${editing.id} updated.` });
      } else {
        await axios.post(`${API}/admin/block/create`, result.data, { headers: authHeader() });
        setBanner({ kind: "success", text: "Block created." });
      }
      setModalOpen(false);
      await loadBlocks();
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
      await axios.delete(`${API}/admin/block/delete/${deleting.id}`, { headers: authHeader() });
      setBanner({ kind: "success", text: `Block #${deleting.id} deleted.` });
      setDeleting(null);
      await loadBlocks();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? "Delete failed")
        : "Unexpected error";
      setBanner({ kind: "error", text: String(message) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blocks"
        subtitle="Top-level areas — buildings live inside blocks."
        action={
          <button type="button" onClick={openCreate} className={btnPrimary}>
            + Add Block
          </button>
        }
      />

      {banner && <AdminAlert kind={banner.kind}>{banner.text}</AdminAlert>}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && loadFailed && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Cannot reach the backend.</p>
          <button type="button" onClick={loadBlocks} className={`${btnSecondary} mt-4`}>
            Retry
          </button>
        </div>
      )}

      {!loading && !loadFailed && blocks.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No blocks yet.</p>
          <button type="button" onClick={openCreate} className={`${btnPrimary} mt-4`}>
            Create the first block
          </button>
        </div>
      )}

      {!loading && !loadFailed && blocks.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Address</th>
                <th className={thClass}>Created By</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {blocks.map((block) => (
                <tr key={block.id} className="transition hover:bg-gray-50">
                  <td className={`${tdClass} font-mono text-xs`}>#{block.id}</td>
                  <td className={`${tdClass} font-semibold text-gray-900`}>{block.name}</td>
                  <td className={tdClass}>{block.address}</td>
                  <td className={tdClass}>{block.created_by?.name ?? "—"}</td>
                  <td className={tdClass}>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(block)} className={btnGhost}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(block)}
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

      {/* Create / Edit modal */}
      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Block #${editing.id}` : "Add Block"}
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
          <Field label="Address" error={errors.address}>
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={submitting}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Saving…" : editing ? "Save Changes" : "Create Block"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete confirmation */}
      <AdminModal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete Block">
        <p className="text-sm text-gray-600">
          Delete <strong>{deleting?.name}</strong>? Buildings inside it may become orphaned.
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
