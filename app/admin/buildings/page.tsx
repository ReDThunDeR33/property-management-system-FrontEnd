"use client";

/* ============================================================
   ADMIN BUILDINGS PAGE — app/admin/buildings/page.tsx  (CSR)
   ------------------------------------------------------------
   COURSE CONCEPTS (same set as the Blocks page):
   1. CSR — "use client" interactive management page
      (course table: "Admin panel -> CSR").
   2. REACT HOOKS — useState (list/modal/form) + useEffect
      (initial load of buildings AND blocks for the parent
      select — two Axios calls on mount).
   3. ZOD — form schema (name required; blockId must be a
      number) validated with safeParse before any request.
   4. AXIOS — axios direct + NEXT_PUBLIC_API_URL (.env.local);
      POST/PATCH/DELETE/GET with the JWT header. No fetch().
   5. DAISYUI — table, modal, select, alert, btn.
   ============================================================ */

import { useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";

type Building = {
  id: number;
  name: string;
  created_at: string;
  block: { id: number; name: string };
};

type BlockOption = { id: number; name: string };

/* Zod schema mirroring the backend DTO: name (string) +
   blockId (the parent block, a number — from the select). */
const buildingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  blockId: z.coerce.number().min(1, "Please choose a block"),
});

type BuildingForm = z.infer<typeof buildingSchema>;
type FieldErrors = Partial<Record<keyof BuildingForm, string>>;

export default function AdminBuildingsPage() {
  // ----- list state (loaded via useEffect) -----
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [blocks, setBlocks] = useState<BlockOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----- modal + form state -----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BuildingForm>({ name: "", blockId: 0 });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [banner, setBanner] = useState("");

  /* useEffect: load buildings + blocks once on mount.
     Blocks feed the parent <select> in the form. */
  useEffect(() => {
    fetchBuildings();
    fetchBlocks();
  }, []);

  async function fetchBuildings() {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/building/allbuildings",
        { headers: authHeader() },
      );
      setBuildings(response.data);
    } catch {
      setError("Could not load buildings. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBlocks() {
    try {
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/block/allblocks",
        { headers: authHeader() },
      );
      setBlocks(response.data);
    } catch {
      // Blocks are only needed for the form — non-fatal here.
      console.error("Could not load blocks for the select");
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: "", blockId: blocks[0]?.id ?? 0 });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEditModal(building: Building) {
    setEditingId(building.id);
    setForm({ name: building.name, blockId: building.block.id });
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  /* Zod validates first; only valid data reaches the backend. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");

    const result = buildingSchema.safeParse(form);
    if (!result.success) {
      const newErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof BuildingForm;
        newErrors[field] = issue.message;
      });
      setFieldErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setFieldErrors({});

      if (editingId === null) {
        await axios.post(
          process.env.NEXT_PUBLIC_API_URL + "/admin/building/create",
          result.data,
          { headers: authHeader() },
        );
        setBanner("Building created successfully.");
      } else {
        await axios.patch(
          process.env.NEXT_PUBLIC_API_URL + `/admin/building/update/${editingId}`,
          result.data,
          { headers: authHeader() },
        );
        setBanner("Building updated successfully.");
      }

      closeModal();
      await fetchBuildings();
      setTimeout(() => setBanner(""), 4000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        setBanner(typeof message === "string" ? message : "Could not save the building.");
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
        process.env.NEXT_PUBLIC_API_URL + `/admin/building/delete/${deleteTarget.id}`,
        { headers: authHeader() },
      );
      setBanner("Building deleted.");
      setDeleteTarget(null);
      await fetchBuildings();
      setTimeout(() => setBanner(""), 4000);
    } catch {
      setBanner("Could not delete the building (it may have properties attached).");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Buildings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Buildings inside blocks, containing properties. {buildings.length} total.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={openCreateModal}
          disabled={blocks.length === 0}
        >
          + New Building
        </button>
      </div>

      {blocks.length === 0 && !loading && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-warning">
            You need at least one block before creating a building.
          </span>
        </div>
      )}

      {banner && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-success">{banner}</span>
        </div>
      )}

      {loading ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-base-300" />
            <div className="h-4 w-full animate-pulse rounded bg-base-300" />
          </div>
        </div>
      ) : error ? (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-error">{error}</span>
          <button className="btn btn-xs" onClick={fetchBuildings}>
            Retry
          </button>
        </div>
      ) : buildings.length === 0 ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body items-center text-center">
            <p className="text-sm text-gray-500">No buildings created yet.</p>
          </div>
        </div>
      ) : (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th>Name</th>
                  <th>Block</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building) => (
                  <tr key={building.id}>
                    <td className="font-semibold">{building.name}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {building.block?.name ?? "-"}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(building.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEditModal(building)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteTarget(building)}
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

      {/* Create/Edit modal (Zod-validated form) */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="text-lg font-bold">
              {editingId === null ? "New Building" : "Edit Building"}
            </h3>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Block (parent)
                </label>
                <select
                  name="blockId"
                  value={form.blockId}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                  disabled={submitting}
                >
                  <option value={0}>Select a block...</option>
                  {blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.blockId && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.blockId}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Building name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Building 1"
                  className="input input-bordered w-full"
                  disabled={submitting}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.name}</p>
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
            <h3 className="text-lg font-bold">Delete building?</h3>
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
