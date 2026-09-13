"use client";

/* ============================================================
   ADMIN BLOCKS PAGE — app/admin/blocks/page.tsx  (CSR)
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. CLIENT-SIDE RENDERING (CSR) — course table:
      "Admin panel -> CSR" and "Search page with filters -> CSR".
      Interactive management page: filters + create/edit/delete
      forms run in the browser with local state.

   2. REACT HOOKS:
      - useState  -> list, filters, modal + form state
      - useEffect -> initial load on mount

   3. ZOD VALIDATION — create/edit form validated with a Zod
      schema (safeParse) before any request. No vanilla/HTML
      validation anywhere.

   4. AXIOS (course convention) — axios direct +
      process.env.NEXT_PUBLIC_API_URL from .env.local.
      fetch() is never used.

   5. DAISYUI — table, modal, select, badge, alert, btn.
   ============================================================ */

import { useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";

type Block = {
  id: number;
  name: string;
  address: string;
  created_at: string;
  created_by: { id: number; name: string } | null;
};

/* Zod schema mirroring the backend DTO:
   name (required, max 100), address (required, max 255). */
const blockSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(255, "Address must be at most 255 characters"),
});

type BlockForm = z.infer<typeof blockSchema>;
type FieldErrors = Partial<Record<keyof BlockForm, string>>;

export default function AdminBlocksPage() {
  // ----- list + filter state (CSR) -----
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  // ----- modal + form state -----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BlockForm>({ name: "", address: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Block | null>(null);
  const [banner, setBanner] = useState("");

  /* useEffect: load all blocks once on mount (CSR pattern). */
  useEffect(() => {
    fetchBlocks();
  }, []);

  // Axios GET — all blocks (JWT protected).
  async function fetchBlocks() {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/block/allblocks",
        { headers: authHeader() },
      );
      setBlocks(response.data);
    } catch {
      setError("Could not load blocks. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  // Axios GET with query param — backend keyword search.
  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) {
      fetchBlocks();
      return;
    }
    try {
      setError("");
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/block/search",
        { params: { keyword: trimmed }, headers: authHeader() },
      );
      setBlocks(response.data);
    } catch {
      setError("Search failed.");
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: "", address: "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEditModal(block: Block) {
    setEditingId(block.id);
    setForm({ name: block.name, address: block.address });
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  // Controlled inputs (useState).
  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  /* Zod validates first; only valid data reaches the backend. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");

    const result = blockSchema.safeParse(form);
    if (!result.success) {
      const newErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof BlockForm;
        newErrors[field] = issue.message;
      });
      setFieldErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setFieldErrors({});

      if (editingId === null) {
        // CREATE
        await axios.post(
          process.env.NEXT_PUBLIC_API_URL + "/admin/block/create",
          result.data,
          { headers: authHeader() },
        );
        setBanner("Block created successfully.");
      } else {
        // UPDATE
        await axios.patch(
          process.env.NEXT_PUBLIC_API_URL + `/admin/block/update/${editingId}`,
          result.data,
          { headers: authHeader() },
        );
        setBanner("Block updated successfully.");
      }

      closeModal();
      await fetchBlocks();
      setTimeout(() => setBanner(""), 4000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        setBanner(typeof message === "string" ? message : "Could not save the block.");
      } else {
        setBanner("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Axios DELETE with confirmation modal.
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await axios.delete(
        process.env.NEXT_PUBLIC_API_URL + `/admin/block/delete/${deleteTarget.id}`,
        { headers: authHeader() },
      );
      setBanner("Block deleted.");
      setDeleteTarget(null);
      await fetchBlocks();
      setTimeout(() => setBanner(""), 4000);
    } catch {
      setBanner("Could not delete the block (it may have buildings attached).");
    } finally {
      setSubmitting(false);
    }
  }

  // Instant client-side filter on top of the fetched list (CSR).
  const visibleBlocks = blocks.filter((block) =>
    block.name.toLowerCase().includes(keyword.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blocks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Top-level areas that contain buildings. {blocks.length} total.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          + New Block
        </button>
      </div>

      {banner && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-success">{banner}</span>
        </div>
      )}

      {/* Keyword search through the backend (Axios query param) */}
      <form onSubmit={handleSearch} className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Search blocks
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search by name..."
            className="input input-bordered input-sm w-64"
          />
        </div>
        <button type="submit" className="btn btn-sm">
          Search
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setKeyword("");
            fetchBlocks();
          }}
        >
          Clear
        </button>
      </form>

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
          <button className="btn btn-xs" onClick={fetchBlocks}>
            Retry
          </button>
        </div>
      ) : visibleBlocks.length === 0 ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body items-center text-center">
            <p className="text-sm text-gray-500">No blocks match your search.</p>
          </div>
        </div>
      ) : (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th>Name</th>
                  <th>Address</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBlocks.map((block) => (
                  <tr key={block.id}>
                    <td className="font-semibold">{block.name}</td>
                    <td className="max-w-sm text-sm text-gray-500">{block.address}</td>
                    <td className="text-xs text-gray-500">
                      {new Date(block.created_at).toLocaleDateString()}
                      <br />
                      <span className="text-gray-400">
                        by {block.created_by?.name ?? "admin"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEditModal(block)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteTarget(block)}
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
              {editingId === null ? "New Block" : "Edit Block"}
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
                  placeholder="e.g. Block A"
                  className="input input-bordered w-full"
                  disabled={submitting}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Address
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="Full address of the block"
                  className="textarea textarea-bordered w-full"
                  disabled={submitting}
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.address}</p>
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
            <h3 className="text-lg font-bold">Delete block?</h3>
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
