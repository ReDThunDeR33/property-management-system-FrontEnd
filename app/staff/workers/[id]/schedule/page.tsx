"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const scheduleSchema = z.object({
  worker: z.object({ name: z.string() }),
  schedule: z.array(
    z.object({
      id: z.number(),
      status: z.string(),
      property: z.object({ unit_number: z.string() }).nullable(),
    })
  ),
});

type Schedule = z.infer<typeof scheduleSchema>;

async function getSchedule(id: string): Promise<Schedule | null> {
  const res = await api.get(`/staff/workers/${id}/schedule`, { headers: authHeader() });
  const parsed = scheduleSchema.safeParse(res.data);
  return parsed.success ? parsed.data : null;
}

export default function WorkerSchedulePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Schedule | null>(null);

  useEffect(() => {
    getSchedule(id).then(setData);
  }, [id]);

  if (!data) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Schedule: {data.worker.name}</h2>
        <Link href={`/staff/workers/${id}`} className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Worker
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-2">ID</div>
          <div className="col-span-6">Property</div>
          <div className="col-span-4">Status</div>
        </div>
        {data.schedule.length === 0 && <div className="p-6 text-sm text-gray-500">No scheduled jobs.</div>}
        {data.schedule.map((s) => (
          <div key={s.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-2 text-gray-900">#{s.id}</div>
            <div className="col-span-6 text-gray-700">{s.property ? s.property.unit_number : "-"}</div>
            <div className="col-span-4">
              <span className={`bg-${statusColor(s.status)}-100 text-${statusColor(s.status)}-600 text-xs px-3 py-1 rounded-full`}>{s.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
