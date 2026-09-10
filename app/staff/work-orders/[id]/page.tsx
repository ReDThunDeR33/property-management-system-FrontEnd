"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

type WorkOrderStatus = "pending" | "assigned" | "tenant_confirmed" | "complete";

const workOrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  labor_cost: z.coerce.number(),
  materials_cost: z.coerce.number(),
  additional_cost: z.coerce.number(),
  landlord: z.object({ name: z.string() }).nullable(),
  tenant: z.object({ name: z.string() }).nullable(),
  property: z.object({ unit_number: z.string() }).nullable(),
  issue: z.object({ description: z.string().nullable() }).nullable(),
  worker: z.object({ id: z.number(), name: z.string() }).nullable(),
});

type WorkOrder = z.infer<typeof workOrderSchema>;

async function getWorkOrder(id: string): Promise<WorkOrder | null> {
  const res = await api.get(`/staff/work-orders/${id}`, { headers: authHeader() });
  const parsed = workOrderSchema.safeParse(res.data);
  return parsed.success ? parsed.data : null;
}

// Which statuses a work order can move to next, per the backend's rules.
function getAllowedStatuses(status: WorkOrderStatus): WorkOrderStatus[] {
  if (status === "pending") return ["pending", "assigned", "complete"];
  if (status === "assigned") return ["assigned", "tenant_confirmed", "pending", "complete"];
  if (status === "tenant_confirmed") return ["tenant_confirmed", "complete", "assigned"];
  return [status];
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [status, setStatus] = useState<WorkOrderStatus>("pending");
  const [laborCost, setLaborCost] = useState("0");
  const [materialsCost, setMaterialsCost] = useState("0");
  const [additionalCost, setAdditionalCost] = useState("0");
  const [workerId, setWorkerId] = useState("");

  function refresh() {
    getWorkOrder(id).then((data) => {
      if (!data) return;
      setOrder(data);
      setStatus(data.status as WorkOrderStatus);
      setLaborCost(String(data.labor_cost));
      setMaterialsCost(String(data.materials_cost));
      setAdditionalCost(String(data.additional_cost));
    });
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    await api.patch(
      `/staff/work-orders/${id}`,
      { status, labor_cost: Number(laborCost), materials_cost: Number(materialsCost), additional_cost: Number(additionalCost) },
      { headers: authHeader() }
    );
    refresh();
  }

  async function handleDispatch(e: FormEvent) {
    e.preventDefault();
    await api.patch(`/staff/work-orders/${id}/dispatch`, { worker_id: Number(workerId) }, { headers: authHeader() });
    setWorkerId("");
    refresh();
  }

  async function handleRemoveWorker() {
    await api.patch(`/staff/work-orders/${id}/remove-worker`, {}, { headers: authHeader() });
    refresh();
  }

  async function handleComplete() {
    await api.patch(`/staff/work-orders/${id}/complete`, {}, { headers: authHeader() });
    refresh();
  }

  async function handleConfirmTenant() {
    await api.patch(`/staff/work-orders/${id}/confirm-tenant`, {}, { headers: authHeader() });
    refresh();
  }

  async function handleReopen() {
    await api.patch(`/staff/work-orders/${id}/reopen`, {}, { headers: authHeader() });
    refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this work order?")) return;
    await api.delete(`/staff/work-orders/${id}`, { headers: authHeader() });
    router.push("/staff/work-orders");
  }

  if (!order) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  const allowedStatuses = getAllowedStatuses(order.status as WorkOrderStatus);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Order #{order.id}</h2>
          <span className={`inline-block mt-1 bg-${statusColor(order.status)}-100 text-${statusColor(order.status)}-600 text-xs px-3 py-1 rounded-full`}>
            {order.status}
          </span>
        </div>
        <Link href="/staff/work-orders" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Work Orders
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Property</div>
                <div className="text-gray-900 font-medium">{order.property ? order.property.unit_number : "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Landlord</div>
                <div className="text-gray-900 font-medium">{order.landlord ? order.landlord.name : "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Tenant</div>
                <div className="text-gray-900 font-medium">{order.tenant ? order.tenant.name : "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Issue</div>
                <div className="text-gray-900 font-medium">{order.issue?.description || "-"}</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Update Status & Costs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as WorkOrderStatus)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost</label>
                <input value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Cost</label>
                <input value={materialsCost} onChange={(e) => setMaterialsCost(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Cost</label>
                <input value={additionalCost} onChange={(e) => setAdditionalCost(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm">
              Save Changes
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-wrap gap-3">
            <button onClick={handleConfirmTenant} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Confirm Tenant
            </button>
            <button onClick={handleComplete} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
              Mark Complete
            </button>
            <button onClick={handleReopen} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Reopen
            </button>
            <button onClick={handleDelete} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
              Delete Order
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Worker</h3>
            {order.worker ? (
              <div className="space-y-3 text-sm">
                <div className="font-medium text-gray-900">{order.worker.name}</div>
                <button onClick={handleRemoveWorker} className="text-sm text-red-600 hover:underline">
                  Remove Worker
                </button>
              </div>
            ) : (
              <form onSubmit={handleDispatch} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Worker ID</label>
                  <input value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm"
                >
                  Dispatch Worker
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
