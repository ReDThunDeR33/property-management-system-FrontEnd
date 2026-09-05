"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const workOrderListItemSchema = z.object({
  id: z.number(),
  status: z.string(),
  created_at: z.string(),
  completed_at: z.string().nullable().optional(),
  labor_cost: z.coerce.number().default(0),
  materials_cost: z.coerce.number().default(0),
  additional_cost: z.coerce.number().default(0),
  landlord: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
});

const workOrdersResponseSchema = z.object({
  data: z.array(workOrderListItemSchema),
  total: z.coerce.number(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  totalPages: z.coerce.number().optional(),
});

type WorkOrder = z.infer<typeof workOrderListItemSchema>;

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (status) params.status = status;
      if (search) params.search = search;

      const res = await api.get("/staff/work-orders", { headers: authHeader(), params });
      const parsed = workOrdersResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setOrders(parsed.data.data);
      setTotal(parsed.data.total);
      setTotalPages(1);
    } catch {
      setError("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage, dispatch, and complete maintenance requests.</p>
        </div>
        <Link
          href="/staff/work-orders/new"
          className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm"
        >
          + Create Work Order
        </Link>
      </div>

      <div className="flex gap-3">
        <select
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="tenant_confirmed">Tenant Confirmed</option>
          <option value="complete">Complete</option>
        </select>
        <input
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder="Search by ID"
          className="border border-gray-200 rounded-lg text-sm px-3 py-2"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Landlord</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2">Cost</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No work orders found.</div>
        )}
        {!loading && !error && orders.map((order) => (
          <div key={order.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-1 text-gray-900">#{order.id}</div>
            <div className="col-span-3 text-gray-700">{order.landlord?.name || "-"}</div>
            <div className="col-span-2 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
            <div className="col-span-2 text-gray-700">
              {(order.labor_cost + order.materials_cost + order.additional_cost).toFixed(2)}
            </div>
            <div className="col-span-2">
              <span className={`bg-${statusColor(order.status)}-100 text-${statusColor(order.status)}-600 text-xs px-3 py-1 rounded-full`}>
                {order.status}
              </span>
            </div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/work-orders/${order.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">
                View
              </Link>
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
