"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader, getClientUser } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const workloadSchema = z.object({
  workerLoad: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      area: z.string().optional(),
      status: z.string(),
      activeOrders: z.coerce.number(),
      completedOrders: z.coerce.number(),
    })
  ),
  propertyLoad: z.array(
    z.object({
      id: z.number(),
      unit: z.string().optional(),
      building: z.string().optional(),
      status: z.string().optional(),
      openWorkOrders: z.coerce.number(),
      openIssues: z.coerce.number(),
      currentTenant: z.string().nullable().optional(),
    })
  ),
});

type Workload = z.infer<typeof workloadSchema>;

export default function DashboardWorkloadPage() {
  const [data, setData] = useState<Workload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const user = getClientUser();
        const staffId = user?.id || 1;
        const res = await api.get("/staff/dashboard/workload", { headers: authHeader(), params: { staffId } });
        const parsed = workloadSchema.safeParse(res.data);
        if (!parsed.success) {
          setError("Invalid data received from server");
          return;
        }
        setData(parsed.data);
      } catch {
        setError("Failed to load workload overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workload Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Current load across workers and properties.</p>
        </div>
        <Link href="/staff/dashboard" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>

      {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
      {error && <div className="p-6 text-sm text-red-500">{error}</div>}

      {data && (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Worker Load</h3>
            </div>
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Area</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Active</div>
              <div className="col-span-2">Completed</div>
            </div>
            {data.workerLoad.length === 0 && <div className="p-6 text-sm text-gray-500">No workers found.</div>}
            {data.workerLoad.map((w) => (
              <div key={w.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
                <div className="col-span-3 text-gray-900 font-medium">{w.name}</div>
                <div className="col-span-3 text-gray-700">{w.area || "-"}</div>
                <div className="col-span-2">
                  <span className={`bg-${statusColor(w.status)}-100 text-${statusColor(w.status)}-600 text-xs px-3 py-1 rounded-full`}>{w.status}</span>
                </div>
                <div className="col-span-2 text-gray-700">{w.activeOrders}</div>
                <div className="col-span-2 text-gray-700">{w.completedOrders}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Property Load</h3>
            </div>
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Unit</div>
              <div className="col-span-3">Building</div>
              <div className="col-span-2">Tenant</div>
              <div className="col-span-2">Open Orders</div>
              <div className="col-span-3">Open Issues</div>
            </div>
            {data.propertyLoad.length === 0 && <div className="p-6 text-sm text-gray-500">No properties found.</div>}
            {data.propertyLoad.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
                <div className="col-span-2 text-gray-900 font-medium">{p.unit || "-"}</div>
                <div className="col-span-3 text-gray-700">{p.building || "-"}</div>
                <div className="col-span-2 text-gray-700">{p.currentTenant || "-"}</div>
                <div className="col-span-2 text-gray-700">{p.openWorkOrders}</div>
                <div className="col-span-3 text-gray-700">{p.openIssues}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
