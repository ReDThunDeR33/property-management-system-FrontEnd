"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const workerSchema = z.object({
  id: z.number(),
  name: z.string(),
  worker_area: z.string().nullable(),
  status: z.string(),
});

const responseSchema = z.object({ data: z.array(workerSchema) });

type Worker = z.infer<typeof workerSchema>;

async function getWorkers(): Promise<Worker[]> {
  const res = await api.get("/staff/workers", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkers().then((data) => {
      setWorkers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workers</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your maintenance workforce.</p>
        </div>
        <Link
          href="/staff/workers/new"
          className="px-4 py-2 bg-[#ff5a3d] text-white rounded-lg text-sm font-medium
             hover:bg-[#e64a32] active:scale-95 transition-all duration-150 shadow-sm"        >
          + Add Worker
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Area</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && workers.length === 0 && <div className="p-6 text-sm text-gray-500">No workers found.</div>}
        {!loading && workers.map((worker) => (
          <div key={worker.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-4 text-gray-900 font-medium">{worker.name}</div>
            <div className="col-span-4 text-gray-700">{worker.worker_area || "-"}</div>
            <div className="col-span-2">
              <span className={`bg-${statusColor(worker.status)}-100 text-${statusColor(worker.status)}-600 text-xs px-3 py-1 rounded-full`}>
                {worker.status}
              </span>
            </div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/workers/${worker.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
