"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const workOrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  created_at: z.string(),
  completed_at: z.string().nullable().optional(),
  labor_cost: z.coerce.number().default(0),
  materials_cost: z.coerce.number().default(0),
  additional_cost: z.coerce.number().default(0),
  landlord: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  tenant: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  property: z.object({ id: z.number(), unit_number: z.string() }).nullable().optional(),
  issue: z.object({ id: z.number(), description: z.string().optional() }).nullable().optional(),
  worker: z.object({ id: z.number(), name: z.string(), worker_area: z.string().optional(), status: z.string().optional() }).nullable().optional(),
});

type WorkOrder = z.infer<typeof workOrderSchema>;

const reviewSchema = z.object({
  id: z.number(),
  rating: z.union([z.string(), z.number()]),
  comment: z.string().nullable().optional(),
});
type Review = z.infer<typeof reviewSchema>;

const nextStatusMap: Record<string, string[]> = {
  pending: ["pending", "assigned", "complete"],
  assigned: ["assigned", "tenant_confirmed", "pending", "complete"],
  tenant_confirmed: ["tenant_confirmed", "complete", "assigned"],
  complete: ["complete"],
};

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusValue, setStatusValue] = useState("");
  const [laborCost, setLaborCost] = useState("0");
  const [materialsCost, setMaterialsCost] = useState("0");
  const [additionalCost, setAdditionalCost] = useState("0");
  const [saving, setSaving] = useState(false);

  const [workerId, setWorkerId] = useState("");
  const [dispatching, setDispatching] = useState(false);

  const [completeLabor, setCompleteLabor] = useState("0");
  const [completeMaterials, setCompleteMaterials] = useState("0");
  const [completeAdditional, setCompleteAdditional] = useState("0");
  const [completing, setCompleting] = useState(false);

  const [review, setReview] = useState<Review | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/staff/work-orders/${id}`, { headers: authHeader() });
      const parsed = workOrderSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setOrder(parsed.data);
      setStatusValue(parsed.data.status);
      setLaborCost(String(parsed.data.labor_cost));
      setMaterialsCost(String(parsed.data.materials_cost));
      setAdditionalCost(String(parsed.data.additional_cost));
    } catch {
      setError("Failed to load work order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReview = useCallback(async () => {
    try {
      const res = await api.get(`/staff/work-orders/${id}/review`, { headers: authHeader() });
      const parsed = reviewSchema.safeParse(res.data);
      setReview(parsed.success ? parsed.data : null);
    } catch {
      setReview(null);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    fetchReview();
  }, [fetchOrder, fetchReview]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(
        `/staff/work-orders/${id}`,
        {
          status: statusValue,
          labor_cost: Number(laborCost) || 0,
          materials_cost: Number(materialsCost) || 0,
          additional_cost: Number(additionalCost) || 0,
        },
        { headers: authHeader() }
      );
      await fetchOrder();
    } catch {
      setError("Failed to update work order");
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async (e: FormEvent) => {
    e.preventDefault();
    if (!workerId) return;
    setDispatching(true);
    setError("");
    try {
      await api.patch(`/staff/work-orders/${id}/dispatch`, { worker_id: Number(workerId) }, { headers: authHeader() });
      setWorkerId("");
      await fetchOrder();
    } catch {
      setError("Failed to dispatch worker");
    } finally {
      setDispatching(false);
    }
  };

  const handleRemoveWorker = async () => {
    if (!confirm("Remove the assigned worker from this order?")) return;
    try {
      await api.patch(`/staff/work-orders/${id}/remove-worker`, {}, { headers: authHeader() });
      await fetchOrder();
    } catch {
      setError("Failed to remove worker");
    }
  };

  const handleComplete = async (e: FormEvent) => {
    e.preventDefault();
    setCompleting(true);
    setError("");
    try {
      await api.patch(
        `/staff/work-orders/${id}/complete`,
        {
          labor_cost: Number(completeLabor) || 0,
          materials_cost: Number(completeMaterials) || 0,
          additional_cost: Number(completeAdditional) || 0,
        },
        { headers: authHeader() }
      );
      await fetchOrder();
    } catch {
      setError("Failed to complete work order");
    } finally {
      setCompleting(false);
    }
  };

  const handleConfirmTenant = async () => {
    try {
      await api.patch(`/staff/work-orders/${id}/confirm-tenant`, {}, { headers: authHeader() });
      await fetchOrder();
    } catch {
      setError("Failed to confirm tenant");
    }
  };

  const handleReopen = async () => {
    if (!confirm("Reopen this work order?")) return;
    try {
      await api.patch(`/staff/work-orders/${id}/reopen`, {}, { headers: authHeader() });
      await fetchOrder();
    } catch {
      setError("Failed to reopen work order");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this work order? This cannot be undone.")) return;
    try {
      await api.delete(`/staff/work-orders/${id}`, { headers: authHeader() });
      router.push("/staff/work-orders");
    } catch {
      setError("Failed to delete work order");
    }
  };

  const handleDeleteReview = async () => {
    if (!review) return;
    if (!confirm("Delete this review?")) return;
    try {
      await api.delete(`/staff/deleteReview/${review.id}`, { headers: authHeader() });
      setReview(null);
    } catch {
      setError("Failed to delete review");
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (error && !order) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!order) return null;

  const totalCost = order.labor_cost + order.materials_cost + order.additional_cost;
  const allowedStatuses = nextStatusMap[order.status] || [order.status];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Order #{order.id}</h2>
          <p className="text-sm text-gray-500 mt-1">Created {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <Link href="/staff/work-orders" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Work Orders
        </Link>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Status</div>
                <span className={`inline-block mt-1 bg-${statusColor(order.status)}-100 text-${statusColor(order.status)}-600 text-xs px-3 py-1 rounded-full`}>
                  {order.status}
                </span>
              </div>
              <div>
                <div className="text-gray-500">Property</div>
                <div className="text-gray-900 font-medium">{order.property?.unit_number || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Landlord</div>
                <div className="text-gray-900 font-medium">{order.landlord?.name || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Tenant</div>
                <div className="text-gray-900 font-medium">{order.tenant?.name || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Issue</div>
                <div className="text-gray-900 font-medium">{order.issue?.description || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Cost</div>
                <div className="text-gray-900 font-medium">{totalCost.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Update Status & Costs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
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
            <button type="submit" disabled={saving} className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Complete Order</h3>
            <p className="text-sm text-gray-500">These costs are added on top of the current totals.</p>
            <form onSubmit={handleComplete} className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labor</label>
                <input value={completeLabor} onChange={(e) => setCompleteLabor(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
                <input value={completeMaterials} onChange={(e) => setCompleteMaterials(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional</label>
                <input value={completeAdditional} onChange={(e) => setCompleteAdditional(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-3">
                <button
                  type="submit"
                  disabled={completing || order.status === "complete"}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  {completing ? "Completing..." : "Mark Complete"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-wrap gap-3">
            <button onClick={handleConfirmTenant} disabled={order.status !== "assigned"} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              Confirm Tenant
            </button>
            <button onClick={handleReopen} disabled={order.status !== "complete"} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
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
              <div className="space-y-2 text-sm">
                <div className="font-medium text-gray-900">{order.worker.name}</div>
                <div className="text-gray-500">{order.worker.worker_area}</div>
                <span className={`inline-block bg-${statusColor(order.worker.status || "")}-100 text-${statusColor(order.worker.status || "")}-600 text-xs px-3 py-1 rounded-full`}>
                  {order.worker.status}
                </span>
                <button onClick={handleRemoveWorker} className="block mt-3 text-sm text-red-600 hover:underline">
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
                  disabled={dispatching}
                  className="w-full px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  {dispatching ? "Dispatching..." : "Dispatch Worker"}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Review</h3>
            {review ? (
              <div className="space-y-2 text-sm">
                <div className="text-gray-900 font-medium">Rating: {review.rating}</div>
                <div className="text-gray-500">{review.comment || "No comment left."}</div>
                <button onClick={handleDeleteReview} className="text-sm text-red-600 hover:underline">
                  Delete Review
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No review yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
