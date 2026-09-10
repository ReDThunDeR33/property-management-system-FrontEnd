"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const workerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  worker_area: z.string().nullable(),
  status: z.string(),
});

type Worker = z.infer<typeof workerSchema>;

async function getWorker(id: string): Promise<Worker | null> {
  const res = await api.get(`/staff/workers/${id}`, { headers: authHeader() });
  const parsed = workerSchema.safeParse(res.data);
  return parsed.success ? parsed.data : null;
}

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [worker, setWorker] = useState<Worker | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");

  function refresh() {
    getWorker(id).then((data) => {
      if (!data) return;
      setWorker(data);
      setName(data.name);
      setPhone(data.phone || "");
      setArea(data.worker_area || "");
    });
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    await api.patch(`/staff/workers/${id}`, { name, phone, worker_area: area }, { headers: authHeader() });
    refresh();
  }

  async function handleToggleStatus() {
    await api.patch(`/staff/workers/${id}/toggle-status`, {}, { headers: authHeader() });
    refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this worker?")) return;
    await api.delete(`/staff/workers/${id}`, { headers: authHeader() });
    router.push("/staff/workers");
  }

  if (!worker) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{worker.name}</h2>
          <span className={`inline-block mt-1 bg-${statusColor(worker.status)}-100 text-${statusColor(worker.status)}-600 text-xs px-3 py-1 rounded-full`}>
            {worker.status}
          </span>
        </div>
        <Link href="/staff/workers" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Workers
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/staff/workers/${id}/schedule`} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          Schedule
        </Link>
        <Link href={`/staff/workers/${id}/performance`} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          Performance
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
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
          <input value={area} onChange={(e) => setArea(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button
          type="submit"
  className="inline-block px-4 py-2 bg-[#ff5a3d] text-white rounded-lg text-sm font-medium hover:bg-[#e64a32] active:scale-95 transition-all duration-150 shadow-sm"          style={{ backgroundColor: "#ff5a3d" }}
        >
          Update
        </button>
      </form>
    </div>
  );
}
