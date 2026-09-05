"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const workerSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().optional(),
  worker_area: z.string().optional(),
  status: z.string(),
});

const workersResponseSchema = z.object({
  data: z.array(workerSchema),
  total: z.coerce.number(),
  page: z.coerce.number(),
  limit: z.coerce.number(),
  totalPages: z.coerce.number(),
});

type Worker = z.infer<typeof workerSchema>;

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [area, setArea] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (status) params.status = status;
      if (area) params.area = area;
      if (search) params.search = search;
      const res = await api.get("/staff/workers", { headers: authHeader(), params });
      const parsed = workersResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setWorkers(parsed.data.data);
      setTotal(parsed.data.total);
      setTotalPages(parsed.data.totalPages || 1);
    } catch {
      setError("Failed to load workers");
    } finally {
      setLoading(false);
    }
  }, [page, status, area, search]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/staff/workers/${id}/toggle-status`, {}, { headers: authHeader() });
      fetchWorkers();
    } catch {
      setError("Failed to toggle worker status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this worker?")) return;
    try {
      await api.delete(`/staff/workers/${id}`, { headers: authHeader() });
      fetchWorkers();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || "Failed to delete worker");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workers</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your maintenance workforce.</p>
        </div>
        <Link
          href="/staff/workers/new"
          className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm"
        >
          + Add Worker
        </Link>
      </div>

      <div className="flex gap-3">
        <select
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="free">Free</option>
          <option value="busy">Busy</option>
        </select>
        <input value={area} onChange={(e) => { setPage(1); setArea(e.target.value); }} placeholder="Area" className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search by name" className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Area</div>
          <div className="col-span-2">Phone</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && workers.length === 0 && <div className="p-6 text-sm text-gray-500">No workers found.</div>}
        {!loading && !error && workers.map((worker) => (
          <div key={worker.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-3 text-gray-900 font-medium">{worker.name}</div>
            <div className="col-span-3 text-gray-700">{worker.worker_area || "-"}</div>
            <div className="col-span-2 text-gray-500">{worker.phone || "-"}</div>
            <div className="col-span-2">
              <span className={`bg-${statusColor(worker.status)}-100 text-${statusColor(worker.status)}-600 text-xs px-3 py-1 rounded-full`}>
                {worker.status}
              </span>
            </div>
            <div className="col-span-2 text-right space-x-3">
              <Link href={`/staff/workers/${worker.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">View</Link>
              <button onClick={() => handleToggleStatus(worker.id)} className="text-sm text-gray-500 hover:underline">Toggle</button>
              <button onClick={() => handleDelete(worker.id)} className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>Page {page} of {totalPages} ({total} total)</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
