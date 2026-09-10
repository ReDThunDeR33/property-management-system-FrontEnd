"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const blockSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string().nullable(),
});

const responseSchema = z.object({ data: z.array(blockSchema) });

type Block = z.infer<typeof blockSchema>;

async function getBlocks(): Promise<Block[]> {
  const res = await api.get("/staff/blocks", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlocks().then((data) => {
      setBlocks(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Blocks</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-6">Address</div>
        </div>
        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && blocks.length === 0 && <div className="p-6 text-sm text-gray-500">No blocks found.</div>}
        {!loading && blocks.map((b) => (
          <div key={b.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-6 text-gray-900 font-medium">{b.name}</div>
            <div className="col-span-6 text-gray-700">{b.address || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
