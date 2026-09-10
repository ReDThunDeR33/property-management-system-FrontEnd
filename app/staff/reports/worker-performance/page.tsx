"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const rowSchema = z.object({
  id: z.number(),
  name: z.string(),
  completedCount: z.number(),
  avgRating: z.union([z.string(), z.number()]),
  totalRevenue: z.number(),
});

const responseSchema = z.object({ data: z.array(rowSchema) });

type Row = z.infer<typeof rowSchema>;

async function getWorkerPerformanceReport(): Promise<Row[]> {
  const res = await api.get("/staff/reports/worker-performance", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

export default function WorkerPerformanceReportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkerPerformanceReport().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Worker Performance Report</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Completed</div>
          <div className="col-span-2">Avg Rating</div>
          <div className="col-span-3">Revenue</div>
        </div>
        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && rows.length === 0 && <div className="p-6 text-sm text-gray-500">No data available.</div>}
        {!loading && rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-4 text-gray-900 font-medium">{r.name}</div>
            <div className="col-span-3 text-gray-700">{r.completedCount}</div>
            <div className="col-span-2 text-gray-700">{r.avgRating}</div>
            <div className="col-span-3 text-gray-700">{r.totalRevenue}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
