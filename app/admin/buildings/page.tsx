"use client";

/* ============================================================
   BUILDINGS PAGE (CSR) — pure Tailwind
   ------------------------------------------------------------
   CRUD for buildings. Each building belongs to a BLOCK — the
   form fetches the block list (Axios) to fill a parent <select>
   (mirrors CreateBuildingDto: name + blockId). Zod-validated,
   cookie JWT, pure Tailwind UI.
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

type BlockRef = { id: number; name: string };
type Building = {
  id: number;
  name: string;
  created_at: string;
  block?: BlockRef | null;
  created_by?: { id: number; name: string } | null;
};

/* ---------- Zod schema (mirrors CreateBuildingDto) ---------- */
const buildingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  blockId: z.number({ message: "Select a block" }).int().positive("Select a block"),
});

type FormState = { name: string; blockId: string };
const EMPTY: FormState = { name: "", blockId: "" };

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [blocks, setBlocks] = useState<BlockRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [deleting, setDeleting] = useState<Building | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  /* ---------- Axios GET loads (buildings + parent blocks) ---------- */
  const loadBuildings = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await axios.get<Building[]>(`${API}/admin/building/allbuildings`, {
        headers: authHeader(),
      });
      setBuildings(response.data);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const loadBlocks = async () => {
    try {
      const response = await axios.get<BlockRef[]>(`${API}/admin/block/allblocks`, {
        headers: authHeader(),
      });
      setBlocks(response.data);
    } catch {
      setBlocks([]);
    }
  };

  useEffect(() => {
    loadBuildings();
    loadBlocks();
  }, []);

  const openCreate = () => {
    if (blocks.length === 0) {
      setBanner({
        kind: "error",
        text: "You need at least one block first — create a block before adding buildings.",
      });
      return;
    }
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (building: Building) => {
    setEditing(building);
    setForm({ name: building.name, blockId: building.block ? String(building.block.id) : "" });
    setErrors({});
    setModalOpen(true);
  };

  /* ---------- Zod + Axios POST/PATCH ---------- */
  const handleSubmit = async () => {
    setBanner(null);

    // blockId: string (select value) → number (backend DTO) via Zod coerce
    const parsedForm = {
      name: form.name,
      blockId: form.blockId === "" ? NaN : Number(form.blockId),
    };
    const result = buildingSchema.safeParse(parsedForm);
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
        await axios.patch(`${API}/admin/building/update/${editing.id}`, result.data, {
          headers: authHeader(),
        });
        setBanner({ kind: "success", text: `Building #${editing.id} updated.` });
      } else {
        await axios.post(`${API}/admin/building/create`, result.data, { headers: authHeader() });
        setBanner({ kind: "success", text: "Building created." });
      }
      setModalOpen(false);
      await loadBuildings();
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
      await axios.delete(`${API}/admin/building/delete/${deleting.id}`, { headers: authHeader() });
      setBanner({ kind: "success", text: `Building #${deleting.id} deleted.` });
      setDeleting(null);
      await loadBuildings();
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
        title="Buildings"
        subtitle="Buildings grouped under blocks."
        action={
          <button type="button" onClick={openCreate} className={btnPrimary}>
            + Add Building
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
          <button type="button" onClick={loadBuildings} className={`${btnSecondary} mt-4`}>
            Retry
          </button>
        </div>
      )}

      {!loading && !loadFailed && buildings.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No buildings yet.</p>
          <button type="button" onClick={openCreate} className={`${btnPrimary} mt-4`}>
            Create the first building
          </button>
        </div>
      )}

      {!loading && !loadFailed && buildings.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Block</th>
                <th className={thClass}>Created By</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {buildings.map((building) => (
                <tr key={building.id} className="transition hover:bg-gray-50">
                  <td className={`${tdClass} font-mono text-xs`}>#{building.id}</td>
                  <td className={`${tdClass} font-semibold text-gray-900`}>{building.name}</td>
                  <td className={tdClass}>{building.block?.name ?? "—"}</td>
                  <td className={tdClass}>{building.created_by?.name ?? "—"}</td>
                  <td className={tdClass}>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(building)} className={btnGhost}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(building)}
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
        title={editing ? `Edit Building #${editing.id}` : "Add Building"}
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
          <Field label="Block" error={errors.blockId}>
            <select
              className={inputClass}
              value={form.blockId}
              onChange={(e) => setForm({ ...form, blockId: e.target.value })}
              disabled={submitting}
            >
              <option value="">Select a block…</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Saving…" : editing ? "Save Changes" : "Create Building"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete confirmation */}
      <AdminModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete Building"
      >
        <p className="text-sm text-gray-600">
          Delete <strong>{deleting?.name}</strong>? Properties inside it may become orphaned.
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
