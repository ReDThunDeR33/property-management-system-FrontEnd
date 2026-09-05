"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const scheduleSchema = z.object({
  worker: z.object({ id: z.number(), name: z.string(), area: z.string().optional(), status: z.string() }),
  schedule: z.array(
    z.object({
      id: z.number(),
      status: z.string(),
      property: z.object({ id: z.number(), unit_number: z.string() }).nullable().optional(),
      issue: z.object({ id: z.number(), description: z.string().optional() }).nullable().optional(),
      tenant: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
    })
  ),
});

type Schedule = z.infer<typeof scheduleSchema>;

export default function WorkerSchedulePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/staff/workers/${id}/schedule`, { headers: authHeader() });
        const parsed = scheduleSchema.safeParse(res.data);
        if (!parsed.success) {
          setError("Invalid data received from server");
          return;
        }
        setData(parsed.data);
      } catch {
        setError("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule{data ? `: ${data.worker.name}` : ""}</h2>
          <p className="text-sm text-gray-500 mt-1">Assigned and upcoming work.</p>
        </div>
        <Link href={`/staff/workers/${id}`} className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Worker
        </Link>
      </div>

      {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
      {error && <div className="p-6 text-sm text-red-500">{error}</div>}

      {data && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">Property</div>
            <div className="col-span-3">Issue</div>
            <div className="col-span-3">Tenant</div>
            <div className="col-span-2">Status</div>
          </div>
          {data.schedule.length === 0 && <div className="p-6 text-sm text-gray-500">No scheduled work orders.</div>}
          {data.schedule.map((s) => (
            <div key={s.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
              <div className="col-span-1 text-gray-900">
                <Link href={`/staff/work-orders/${s.id}`} className="text-dwellix-500 hover:underline">#{s.id}</Link>
              </div>
              <div className="col-span-3 text-gray-700">{s.property?.unit_number || "-"}</div>
              <div className="col-span-3 text-gray-700">{s.issue?.description || "-"}</div>
              <div className="col-span-3 text-gray-700">{s.tenant?.name || "-"}</div>
              <div className="col-span-2">
                <span className={`bg-${statusColor(s.status)}-100 text-${statusColor(s.status)}-600 text-xs px-3 py-1 rounded-full`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
