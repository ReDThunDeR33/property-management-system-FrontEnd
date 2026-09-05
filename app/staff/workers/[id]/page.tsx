"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const workerDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  worker_area: z.string().optional(),
  status: z.string(),
  workOrders: z.array(z.object({ id: z.number(), status: z.string() })).optional().default([]),
});

type WorkerDetail = z.infer<typeof workerDetailSchema>;

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", phone: "", worker_area: "", status: "free" });

  const fetchWorker = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/staff/workers/${id}`, { headers: authHeader() });
      const parsed = workerDetailSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setWorker(parsed.data);
      setForm({
        name: parsed.data.name,
        email: parsed.data.email || "",
        phone: parsed.data.phone || "",
        worker_area: parsed.data.worker_area || "",
        status: parsed.data.status,
      });
    } catch {
      setError("Failed to load worker");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/staff/workers/${id}`, form, { headers: authHeader() });
      await fetchWorker();
    } catch {
      setError("Failed to update worker");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await api.patch(`/staff/workers/${id}/toggle-status`, {}, { headers: authHeader() });
      await fetchWorker();
    } catch {
      setError("Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this worker?")) return;
    try {
      await api.delete(`/staff/workers/${id}`, { headers: authHeader() });
      router.push("/staff/workers");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || "Failed to delete worker");
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (error && !worker) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!worker) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{worker.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className={`inline-block bg-${statusColor(worker.status)}-100 text-${statusColor(worker.status)}-600 text-xs px-3 py-1 rounded-full`}>
              {worker.status}
            </span>
          </p>
        </div>
        <Link href="/staff/workers" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Workers
        </Link>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="flex gap-3">
        <Link href={`/staff/workers/${id}/schedule`} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          View Schedule
        </Link>
        <Link href={`/staff/workers/${id}/performance`} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          View Performance
        </Link>
        <button onClick={handleToggleStatus} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          Toggle Status
        </button>
        <button onClick={handleDelete} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
          Delete Worker
        </button>
      </div>

      <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-lg">
        <h3 className="text-lg font-bold text-gray-900">Edit Details</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
          <input value={form.worker_area} onChange={(e) => setForm({ ...form, worker_area: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="free">Free</option>
            <option value="busy">Busy</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Work Orders</h3>
        </div>
        {worker.workOrders.length === 0 && <div className="p-6 text-sm text-gray-500">No work orders assigned.</div>}
        {worker.workOrders.map((wo) => (
          <div key={wo.id} className="flex justify-between items-center p-4 border-b border-gray-100 text-sm">
            <div className="text-gray-900">#{wo.id}</div>
            <span className={`bg-${statusColor(wo.status)}-100 text-${statusColor(wo.status)}-600 text-xs px-3 py-1 rounded-full`}>{wo.status}</span>
            <Link href={`/staff/work-orders/${wo.id}`} className="text-dwellix-500 hover:underline">View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
