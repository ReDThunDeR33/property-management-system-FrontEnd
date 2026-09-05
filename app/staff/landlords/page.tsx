"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const landlordSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  properties: z.array(z.any()).optional().default([]),
  tenants: z.array(z.any()).optional().default([]),
});

const landlordsResponseSchema = z.array(landlordSchema);

type Landlord = z.infer<typeof landlordSchema>;

export default function LandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/staff/landlords", { headers: authHeader() });
        const parsed = landlordsResponseSchema.safeParse(res.data);
        if (!parsed.success) {
          setError("Invalid data received from server");
          return;
        }
        setLandlords(parsed.data);
      } catch {
        setError("Failed to load landlords");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Landlords</h2>
        <p className="text-sm text-gray-500 mt-1">{landlords.length} landlords on file.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Properties</div>
          <div className="col-span-2">Tenants</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && landlords.length === 0 && <div className="p-6 text-sm text-gray-500">No landlords found.</div>}
        {!loading && !error && landlords.map((l) => (
          <div key={l.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-4 text-gray-900 font-medium">{l.name}</div>
            <div className="col-span-4 text-gray-700">{l.email || "-"}</div>
            <div className="col-span-2 text-gray-700">{l.properties.length}</div>
            <div className="col-span-2 text-gray-700">{l.tenants.length}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
