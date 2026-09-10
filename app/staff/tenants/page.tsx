"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const tenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string().nullable(),
  property: z.object({ unit_number: z.string() }).nullable(),
});

const responseSchema = z.object({ data: z.array(tenantSchema) });

type Tenant = z.infer<typeof tenantSchema>;

async function getTenants(): Promise<Tenant[]> {
  const res = await api.get("/staff/tenants", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTenants().then((data) => {
      setTenants(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Tenants</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Property</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && tenants.length === 0 && <div className="p-6 text-sm text-gray-500">No tenants found.</div>}
        {!loading && tenants.map((t) => (
          <div key={t.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-4 text-gray-900 font-medium">{t.name}</div>
            <div className="col-span-3 text-gray-700">{t.property ? t.property.unit_number : "-"}</div>
            <div className="col-span-3 text-gray-700">{t.status || "-"}</div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/tenants/${t.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
