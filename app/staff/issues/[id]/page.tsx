"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const issueDetailSchema = z.object({
  id: z.number(),
  description: z.string().optional(),
  status: z.string(),
  created_at: z.string(),
  tenant: z.object({ id: z.number(), name: z.string(), email: z.string().optional(), phone: z.string().optional() }).nullable().optional(),
  property: z.object({
    id: z.number(),
    unit_number: z.string(),
    landlord: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  }).nullable().optional(),
});

type IssueDetail = z.infer<typeof issueDetailSchema>;

export default function IssueDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("OPEN");
  const [notes, setNotes] = useState("");

  const fetchIssue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/staff/issues/${id}`, { headers: authHeader() });
      const parsed = issueDetailSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setIssue(parsed.data);
      setStatus(parsed.data.status);
    } catch {
      setError("Failed to load issue");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/staff/issues/${id}/status`, { status, resolutionNotes: notes }, { headers: authHeader() });
      await fetchIssue();
    } catch {
      setError("Failed to update issue");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (error && !issue) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!issue) return null;

  const workOrderParams = new URLSearchParams();
  if (issue.property?.id) workOrderParams.set("property_id", String(issue.property.id));
  workOrderParams.set("issue_id", String(issue.id));
  if (issue.property?.landlord?.id) workOrderParams.set("landlord_id", String(issue.property.landlord.id));
  if (issue.tenant?.id) workOrderParams.set("tenant_id", String(issue.tenant.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Issue #{issue.id}</h2>
          <p className="text-sm text-gray-500 mt-1">Reported {new Date(issue.created_at).toLocaleString()}</p>
        </div>
        <Link href="/staff/issues" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Issues
        </Link>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Status</div>
            <span className={`inline-block mt-1 bg-${statusColor(issue.status)}-100 text-${statusColor(issue.status)}-600 text-xs px-3 py-1 rounded-full`}>
              {issue.status}
            </span>
          </div>
          <div>
            <div className="text-gray-500">Property</div>
            <div className="text-gray-900 font-medium">{issue.property?.unit_number || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Tenant</div>
            <div className="text-gray-900 font-medium">{issue.tenant?.name || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">Landlord</div>
            <div className="text-gray-900 font-medium">{issue.property?.landlord?.name || "-"}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500">Description</div>
            <div className="text-gray-900">{issue.description || "-"}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-lg">
        <h3 className="text-lg font-bold text-gray-900">Update Status</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm disabled:opacity-50">
          {saving ? "Saving..." : "Save Status"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <Link href={`/staff/work-orders/new?${workOrderParams.toString()}`} className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm inline-block">
          + Create Work Order From This Issue
        </Link>
      </div>
    </div>
  );
}
