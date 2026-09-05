"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const buildingSchema = z.object({
  id: z.number(),
  name: z.string(),
  block: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  created_at: z.string().optional(),
});

const buildingsResponseSchema = z.object({
  data: z.array(buildingSchema),
  total: z.coerce.number(),
  page: z.coerce.number(),
  limit: z.coerce.number(),
  totalPages: z.coerce.number(),
});

type Building = z.infer<typeof buildingSchema>;

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [blockId, setBlockId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (blockId) params.blockId = blockId;
      if (search) params.search = search;
      const res = await api.get("/staff/buildings", { headers: authHeader(), params });
      const parsed = buildingsResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setBuildings(parsed.data.data);
      setTotal(parsed.data.total);
      setTotalPages(parsed.data.totalPages || 1);
    } catch {
      setError("Failed to load buildings");
    } finally {
      setLoading(false);
    }
  }, [page, blockId, search]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Buildings</h2>
        <p className="text-sm text-gray-500 mt-1">{total} buildings on file.</p>
      </div>

      <div className="flex gap-3">
        <input value={blockId} onChange={(e) => { setPage(1); setBlockId(e.target.value); }} placeholder="Block ID" className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search by name" className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-6">Block</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && buildings.length === 0 && <div className="p-6 text-sm text-gray-500">No buildings found.</div>}
        {!loading && !error && buildings.map((b) => (
          <div key={b.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-6 text-gray-900 font-medium">{b.name}</div>
            <div className="col-span-6 text-gray-700">{b.block?.name || "-"}</div>
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
