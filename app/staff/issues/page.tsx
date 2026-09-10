"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const issueSchema = z.object({
  id: z.number(),
  description: z.string().nullable(),
  status: z.string(),
  property: z.object({ unit_number: z.string() }).nullable(),
  tenant: z.object({ name: z.string() }).nullable(),
});

const responseSchema = z.object({ data: z.array(issueSchema) });

type Issue = z.infer<typeof issueSchema>;

async function getIssues(): Promise<Issue[]> {
  const res = await api.get("/staff/issues", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIssues().then((data) => {
      setIssues(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Issues</h2>
        <p className="text-sm text-gray-500 mt-1">Tenant-reported issues awaiting triage.</p>
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
        {!loading && issues.length === 0 && <div className="p-6 text-sm text-gray-500">No issues found.</div>}
        {!loading && issues.map((issue) => (
          <div key={issue.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-4 text-gray-900 font-medium">{issue.description || "-"}</div>
            <div className="col-span-2 text-gray-700">{issue.property ? issue.property.unit_number : "-"}</div>
            <div className="col-span-2 text-gray-700">{issue.tenant ? issue.tenant.name : "-"}</div>
            <div className="col-span-2">
              <span className={`bg-${statusColor(issue.status)}-100 text-${statusColor(issue.status)}-600 text-xs px-3 py-1 rounded-full`}>{issue.status}</span>
            </div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/issues/${issue.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
