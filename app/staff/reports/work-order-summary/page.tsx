"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const rowSchema = z.object({
  status: z.string(),
  count: z.coerce.number(),
  avgCost: z.coerce.number(),
  totalCost: z.coerce.number(),
});

const responseSchema = z.array(rowSchema);

type Row = z.infer<typeof rowSchema>;

export default function WorkOrderSummaryReportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (status) params.status = status;
      const res = await api.get("/staff/reports/work-order-summary", { headers: authHeader(), params });
      const parsed = responseSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setRows(parsed.data);
    } catch {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, status]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Work Order Summary Report</h2>
        <p className="text-sm text-gray-500 mt-1">Counts and costs grouped by status.</p>
      </div>

      <div className="flex gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="tenant_confirmed">Tenant Confirmed</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Status</div>
          <div className="col-span-3">Count</div>
          <div className="col-span-3">Avg Cost</div>
          <div className="col-span-3">Total Cost</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && rows.length === 0 && <div className="p-6 text-sm text-gray-500">No data for this range.</div>}
        {!loading && !error && rows.map((r) => (
          <div key={r.status} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-3">
              <span className={`bg-${statusColor(r.status)}-100 text-${statusColor(r.status)}-600 text-xs px-3 py-1 rounded-full`}>{r.status}</span>
            </div>
            <div className="col-span-3 text-gray-700">{r.count}</div>
            <div className="col-span-3 text-gray-700">{r.avgCost.toFixed(2)}</div>
            <div className="col-span-3 text-gray-700">{r.totalCost.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
