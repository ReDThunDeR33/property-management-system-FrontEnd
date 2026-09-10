"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const propertySchema = z.object({
  id: z.number(),
  unit_number: z.string(),
  status: z.string().nullable(),
  landlord: z.object({ name: z.string() }).nullable(),
  tenant: z.object({ name: z.string() }).nullable(),
});

const responseSchema = z.object({ data: z.array(propertySchema) });

type Property = z.infer<typeof propertySchema>;

async function getProperties(): Promise<Property[]> {
  const res = await api.get("/staff/properties", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProperties().then((data) => {
      setProperties(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Properties</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Unit</div>
          <div className="col-span-3">Landlord</div>
          <div className="col-span-3">Tenant</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && properties.length === 0 && <div className="p-6 text-sm text-gray-500">No properties found.</div>}
        {!loading && properties.map((p) => (
          <div key={p.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-3 text-gray-900 font-medium">{p.unit_number}</div>
            <div className="col-span-3 text-gray-700">{p.landlord ? p.landlord.name : "-"}</div>
            <div className="col-span-3 text-gray-700">{p.tenant ? p.tenant.name : "-"}</div>
            <div className="col-span-1 text-gray-700">{p.status || "-"}</div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/properties/${p.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
