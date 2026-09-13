"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const perfSchema = z.object({
  worker: z.object({ id: z.number(), name: z.string() }),
  recentOrders: z.array(z.object({ id: z.number(), property: z.string().nullable(), property_id: z.number().nullable(), cost: z.number(), rating: z.string().nullable() })),
  stats: z.object({
    totalCompleted: z.number(),
    averageRating: z.number(),
    totalRevenueGenerated: z.number(),
  }),
});

type Perf = z.infer<typeof perfSchema>;

async function getPerformance(id: string): Promise<Perf | null> {
  const res = await api.get(`/staff/workers/${id}/performance`, { headers: authHeader() });
  const parsed = perfSchema.safeParse(res.data);
  return parsed.success ? parsed.data : null;
}

export default function WorkerPerformancePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Perf | null>(null);

  useEffect(() => {
    getPerformance(id).then(setData);
  }, [id]);

  if (!data) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-gray-900">Performance: {data.worker.name}</h2><p className="text-xs text-gray-400 mt-1">Worker ID: {data.worker.id}</p></div>
        <Link href={`/staff/workers/${id}`} className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Worker
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Completed Jobs</div>
          <div className="text-3xl font-bold text-gray-900">{data.stats.totalCompleted}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Average Rating</div>
          <div className="text-3xl font-bold text-gray-900">{data.stats.averageRating}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Revenue Generated</div>
          <div className="text-3xl font-bold text-gray-900">{data.stats.totalRevenueGenerated}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Recent Work Orders</h3>
        {data.recentOrders.length === 0 && <p className="text-sm text-gray-500">No completed work orders.</p>}
        {data.recentOrders.map((order) => (
          <div key={order.id} className="border-b last:border-b-0 py-3">
            <div className="font-medium">Work Order #{order.id}</div>
            <div className="text-xs text-gray-400">Property ID: {order.property_id ?? "-"}</div>
            <div className="text-sm text-gray-600">Cost: {order.cost}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
