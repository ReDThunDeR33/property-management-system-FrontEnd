"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const buildingSchema = z.object({
  id: z.number(),
  name: z.string(),
  block: z.object({ name: z.string() }).nullable(),
});

const responseSchema = z.object({ data: z.array(buildingSchema) });

type Building = z.infer<typeof buildingSchema>;

async function getBuildings(): Promise<Building[]> {
  const res = await api.get("/staff/buildings", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBuildings().then((data) => {
      setBuildings(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Buildings</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-6">Block</div>
        </div>
        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && buildings.length === 0 && <div className="p-6 text-sm text-gray-500">No buildings found.</div>}
        {!loading && buildings.map((b) => (
          <div key={b.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-6 text-gray-900 font-medium">{b.name}</div>
            <div className="col-span-6 text-gray-700">{b.block ? b.block.name : "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
