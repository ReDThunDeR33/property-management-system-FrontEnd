"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const landlordSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
});

const responseSchema = z.array(landlordSchema);

type Landlord = z.infer<typeof landlordSchema>;

async function getLandlords(): Promise<Landlord[]> {
  const res = await api.get("/staff/landlords", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data : [];
}

export default function LandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLandlords().then((data) => {
      setLandlords(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Landlords</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-6">Email</div>
        </div>
        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && landlords.length === 0 && <div className="p-6 text-sm text-gray-500">No landlords found.</div>}
        {!loading && landlords.map((l) => (
          <div key={l.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-6 text-gray-900 font-medium">{l.name}</div>
            <div className="col-span-6 text-gray-700">{l.email || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
