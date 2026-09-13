"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const tenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.string().nullable(),
  property: z.object({ id: z.number(), unit_number: z.string() }).nullable(),
  approved_by: z.object({ id: z.number(), name: z.string() }).nullable(),
});

type Tenant = z.infer<typeof tenantSchema>;

async function getTenant(id: string): Promise<Tenant | null> {
  const res = await api.get(`/staff/tenants/${id}`, { headers: authHeader() });
  const parsed = tenantSchema.safeParse(res.data);
  return parsed.success ? parsed.data : null;
}

export default function TenantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    getTenant(id).then(setTenant);
  }, [id]);

  if (!tenant) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2><p className="text-xs text-gray-400 mt-1">Tenant ID: {tenant.id}</p></div>
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
          <div className="text-gray-900 font-medium">{tenant.property ? tenant.property.unit_number : "-"}</div>
          <div className="text-xs text-gray-400">Property ID: {tenant.property ? tenant.property.id : "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Approved By</div>
          <div className="text-gray-900 font-medium">{tenant.approved_by ? tenant.approved_by.name : "-"}</div>
          <div className="text-xs text-gray-400">Landlord ID: {tenant.approved_by ? tenant.approved_by.id : "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Status</div>
          <div className="text-gray-900 font-medium">{tenant.status || "-"}</div>
        </div>
      </div>
    </div>
  );
}
