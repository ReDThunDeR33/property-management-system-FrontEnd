"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

const issueSchema = z.object({
  id: z.number(),
  description: z.string().nullable(),
  status: z.string(),
  property: z.object({ id: z.number(), unit_number: z.string() }).nullable(),
  tenant: z.object({ id: z.number(), name: z.string() }).nullable(),
});

type Issue = z.infer<typeof issueSchema>;

async function getIssue(id: string): Promise<Issue | null> {
  const res = await api.get(`/staff/issues/${id}`, { headers: authHeader() });
  const parsed = issueSchema.safeParse(res.data);
  return parsed.success ? parsed.data : null;
}

export default function IssueDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [status, setStatus] = useState<IssueStatus>("OPEN");

  function refresh() {
    getIssue(id).then((data) => {
      if (!data) return;
      setIssue(data);
      setStatus(data.status as IssueStatus);
    });
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    await api.patch(`/staff/issues/${id}/status`, { status }, { headers: authHeader() });
    refresh();
  }

  if (!issue) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Issue #{issue.id}</h2>
          <span className={`inline-block mt-1 bg-${statusColor(issue.status)}-100 text-${statusColor(issue.status)}-600 text-xs px-3 py-1 rounded-full`}>
            {issue.status}
          </span>
        </div>
        <Link href="/staff/issues" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Issues
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Property</div>
            <div className="text-gray-900 font-medium">{issue.property ? issue.property.unit_number : "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Tenant</div>
            <div className="text-gray-900 font-medium">{issue.tenant ? issue.tenant.name : "-"}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500">Description</div>
            <div className="text-gray-900">{issue.description || "-"}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-lg">
        <h3 className="text-lg font-bold text-gray-900">Update Status</h3>
        <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-white rounded-lg text-sm font-medium active:scale-95 transition-all duration-150 shadow-sm"
          style={{ backgroundColor: "#ff5a3d" }}
        >
          Save Changes
        </button>
      </form>

      <Link
        href={`/staff/work-orders/new?issue_id=${issue.id}&property_id=${issue.property?.id || ""}&tenant_id=${issue.tenant?.id || ""}`}
        className="inline-block px-4 py-2 bg-[#ff5a3d] text-white rounded-lg text-sm font-medium hover:bg-[#e64a32] active:scale-95 transition-all duration-150 shadow-sm"
      >
        + Create Work Order
      </Link>
    </div>
  );
}
