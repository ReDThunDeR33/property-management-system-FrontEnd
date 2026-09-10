"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const rowSchema = z.object({
  status: z.string(),
  count: z.number(),
  avgCost: z.number(),
  totalCost: z.number(),
});

const responseSchema = z.array(rowSchema);

type Row = z.infer<typeof rowSchema>;

async function getWorkOrderSummaryReport(): Promise<Row[]> {
  const res = await api.get("/staff/reports/work-order-summary", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data : [];
}

export default function WorkOrderSummaryReportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkOrderSummaryReport().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Work Order Summary Report</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Status</div>
          <div className="col-span-3">Count</div>
          <div className="col-span-3">Avg Cost</div>
          <div className="col-span-3">Total Cost</div>
        </div>
        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && rows.length === 0 && <div className="p-6 text-sm text-gray-500">No data found.</div>}
        {!loading && rows.map((r) => (
          <div key={r.status} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-3">
              <span className={`bg-${statusColor(r.status)}-100 text-${statusColor(r.status)}-600 text-xs px-3 py-1 rounded-full`}>{r.status}</span>
            </div>
            <div className="col-span-3 text-gray-700">{r.count}</div>
            <div className="col-span-3 text-gray-700">{r.avgCost}</div>
            <div className="col-span-3 text-gray-700">{r.totalCost}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
