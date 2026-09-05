"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const rowSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string(),
  completedCount: z.coerce.number(),
  avgRating: z.union([z.string(), z.number()]),
  totalRevenue: z.coerce.number(),
});

const responseSchema = z.object({
  data: z.array(rowSchema),
  total: z.coerce.number(),
});

type Row = z.infer<typeof rowSchema>;

export default function WorkerPerformanceReportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/staff/reports/worker-performance", { headers: authHeader() });
        const parsed = responseSchema.safeParse(res.data);
        if (!parsed.success) {
          setError("Invalid data received from server");
          return;
        }
        setRows(parsed.data.data);
      } catch {
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Worker Performance Report</h2>
        <p className="text-sm text-gray-500 mt-1">Completed jobs, ratings, and revenue per worker.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Completed</div>
          <div className="col-span-2">Avg Rating</div>
          <div className="col-span-3">Revenue</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && rows.length === 0 && <div className="p-6 text-sm text-gray-500">No data available.</div>}
        {!loading && !error && rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-3 text-gray-900 font-medium">{r.name}</div>
            <div className="col-span-2 text-gray-700">{r.status}</div>
            <div className="col-span-2 text-gray-700">{r.completedCount}</div>
            <div className="col-span-2 text-gray-700">{r.avgRating}</div>
            <div className="col-span-3 text-gray-700">{r.totalRevenue}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
