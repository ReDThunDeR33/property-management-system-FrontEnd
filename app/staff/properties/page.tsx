"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const propertySchema = z.object({
  id: z.number(),
  unit_number: z.string(),
  rent_amount: z.coerce.number().optional(),
  status: z.string().optional(),
  building: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  landlord: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  tenant: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
});

const propertiesResponseSchema = z.object({
  data: z.array(propertySchema),
  total: z.coerce.number(),
});

type Property = z.infer<typeof propertySchema>;

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [landlordId, setLandlordId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (landlordId) params.landlordId = landlordId;
      const res = await api.get("/staff/properties", { headers: authHeader(), params });
      const parsed = propertiesResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        setError("Invalid data received from server");
        return;
      }
      setProperties(parsed.data.data);
      setTotal(parsed.data.total);
    } catch {
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [landlordId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Properties</h2>
        <p className="text-sm text-gray-500 mt-1">{total} properties on file.</p>
      </div>

      <div className="flex gap-3">
        <input
          value={landlordId}
          onChange={(e) => setLandlordId(e.target.value)}
          placeholder="Filter by Landlord ID"
          className="border border-gray-200 rounded-lg text-sm px-3 py-2"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-2">Unit</div>
          <div className="col-span-2">Building</div>
          <div className="col-span-2">Landlord</div>
          <div className="col-span-2">Tenant</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && properties.length === 0 && <div className="p-6 text-sm text-gray-500">No properties found.</div>}
        {!loading && !error && properties.map((p) => (
          <div key={p.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-2 text-gray-900 font-medium">{p.unit_number}</div>
            <div className="col-span-2 text-gray-700">{p.building?.name || "-"}</div>
            <div className="col-span-2 text-gray-700">{p.landlord?.name || "-"}</div>
            <div className="col-span-2 text-gray-700">{p.tenant?.name || "-"}</div>
            <div className="col-span-2">
              <span className={`bg-${statusColor(p.status || "")}-100 text-${statusColor(p.status || "")}-600 text-xs px-3 py-1 rounded-full`}>{p.status}</span>
            </div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/properties/${p.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
