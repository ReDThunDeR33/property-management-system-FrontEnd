"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const issueSchema = z.object({
  id: z.number(),
  description: z.string().optional(),
  status: z.string(),
  created_at: z.string(),
  tenant: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  property: z.object({ id: z.number(), unit_number: z.string() }).nullable().optional(),
});

const issuesResponseSchema = z.object({
  data: z.array(issueSchema),
  total: z.coerce.number(),
});

type Issue = z.infer<typeof issueSchema>;

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tenantId, setTenantId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (tenantId) params.tenantId = tenantId;
      const res = await api.get("/staff/issues", { headers: authHeader(), params });
      const parsed = issuesResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setIssues(parsed.data.data);
      setTotal(parsed.data.total);
    } catch {
      setError("Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [page, tenantId]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const visibleIssues = statusFilter ? issues.filter((i) => i.status === statusFilter) : issues;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Issues</h2>
        <p className="text-sm text-gray-500 mt-1">Tenant-reported issues awaiting triage.</p>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <input
          value={tenantId}
          onChange={(e) => { setPage(1); setTenantId(e.target.value); }}
          placeholder="Filter by Tenant ID"
          className="border border-gray-200 rounded-lg text-sm px-3 py-2"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Description</div>
          <div className="col-span-2">Property</div>
          <div className="col-span-2">Tenant</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && visibleIssues.length === 0 && <div className="p-6 text-sm text-gray-500">No issues found.</div>}
        {!loading && !error && visibleIssues.map((issue) => (
          <div key={issue.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-4 text-gray-900 font-medium">{issue.description || "-"}</div>
            <div className="col-span-2 text-gray-700">{issue.property?.unit_number || "-"}</div>
            <div className="col-span-2 text-gray-700">{issue.tenant?.name || "-"}</div>
            <div className="col-span-2">
              <span className={`bg-${statusColor(issue.status)}-100 text-${statusColor(issue.status)}-600 text-xs px-3 py-1 rounded-full`}>{issue.status}</span>
            </div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/issues/${issue.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">View</Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>Page {page} of {totalPages} ({total} total)</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
