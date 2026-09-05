"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const tenantDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  has_vehicle: z.boolean().optional(),
  property: z.object({ id: z.number(), unit_number: z.string() }).nullable().optional(),
  approved_by: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  issues: z.array(z.object({ id: z.number(), description: z.string().optional(), status: z.string() })).optional().default([]),
});

type TenantDetail = z.infer<typeof tenantDetailSchema>;

export default function TenantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/staff/tenants/${id}`, { headers: authHeader() });
        const parsed = tenantDetailSchema.safeParse(res.data);
        if (!parsed.success) {
          setError("Invalid data received from server");
          return;
        }
        setTenant(parsed.data);
      } catch {
        setError("Failed to load tenant");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (error && !tenant) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!tenant) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className={`inline-block bg-${statusColor(tenant.status || "")}-100 text-${statusColor(tenant.status || "")}-600 text-xs px-3 py-1 rounded-full`}>
              {tenant.status}
            </span>
          </p>
        </div>
        <Link href="/staff/tenants" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Tenants
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Email</div>
          <div className="text-gray-900 font-medium">{tenant.email || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Phone</div>
          <div className="text-gray-900 font-medium">{tenant.phone || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Property</div>
          <div className="text-gray-900 font-medium">{tenant.property?.unit_number || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Approved By</div>
          <div className="text-gray-900 font-medium">{tenant.approved_by?.name || "-"}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Issues</h3>
        </div>
        {tenant.issues.length === 0 && <div className="p-6 text-sm text-gray-500">No issues reported.</div>}
        {tenant.issues.map((issue) => (
          <div key={issue.id} className="flex justify-between items-center p-4 border-b border-gray-100 text-sm">
            <div className="text-gray-900">{issue.description || "-"}</div>
            <span className={`bg-${statusColor(issue.status)}-100 text-${statusColor(issue.status)}-600 text-xs px-3 py-1 rounded-full`}>{issue.status}</span>
            <Link href={`/staff/issues/${issue.id}`} className="text-dwellix-500 hover:underline">View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
