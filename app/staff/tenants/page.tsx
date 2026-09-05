"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const tenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  status: z.string().optional(),
  property: z.object({ id: z.number(), unit_number: z.string() }).nullable().optional(),
});

const tenantsResponseSchema = z.object({
  data: z.array(tenantSchema),
  total: z.coerce.number(),
});

type Tenant = z.infer<typeof tenantSchema>;

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (status) params.status = status;
      if (propertyId) params.propertyId = propertyId;
      if (search) params.search = search;
      const res = await api.get("/staff/tenants", { headers: authHeader(), params });
      const parsed = tenantsResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setTenants(parsed.data.data);
      setTotal(parsed.data.total);
    } catch {
      setError("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }, [page, status, propertyId, search]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tenants</h2>
        <p className="text-sm text-gray-500 mt-1">{total} tenants on file.</p>
      </div>

      <div className="flex gap-3">
        <input value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} placeholder="Status" className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
        <input value={propertyId} onChange={(e) => { setPage(1); setPropertyId(e.target.value); }} placeholder="Property ID" className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search by name" className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Property</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && tenants.length === 0 && <div className="p-6 text-sm text-gray-500">No tenants found.</div>}
        {!loading && !error && tenants.map((t) => (
          <div key={t.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-3 text-gray-900 font-medium">{t.name}</div>
            <div className="col-span-3 text-gray-700">{t.email || "-"}</div>
            <div className="col-span-2 text-gray-700">{t.property?.unit_number || "-"}</div>
            <div className="col-span-2">
              <span className={`bg-${statusColor(t.status || "")}-100 text-${statusColor(t.status || "")}-600 text-xs px-3 py-1 rounded-full`}>{t.status}</span>
            </div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/tenants/${t.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">View</Link>
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
