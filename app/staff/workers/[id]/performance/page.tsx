"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const perfSchema = z.object({
  worker: z.object({ id: z.number(), name: z.string(), area: z.string().optional() }),
  stats: z.object({
    totalCompleted: z.coerce.number(),
    ratedCount: z.coerce.number(),
    averageRating: z.coerce.number(),
    totalRevenueGenerated: z.coerce.number(),
  }),
  recentOrders: z.array(
    z.object({
      id: z.number(),
      property: z.string().optional(),
      cost: z.coerce.number().optional(),
      rating: z.union([z.string(), z.number()]).optional(),
    })
  ),
});

type Perf = z.infer<typeof perfSchema>;

export default function WorkerPerformancePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Perf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/staff/workers/${id}/performance`, { headers: authHeader() });
        const parsed = perfSchema.safeParse(res.data);
        if (!parsed.success) {
          setError("Invalid data received from server");
          return;
        }
        setData(parsed.data);
      } catch {
        setError("Failed to load performance data");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance{data ? `: ${data.worker.name}` : ""}</h2>
          <p className="text-sm text-gray-500 mt-1">Completed jobs and ratings.</p>
        </div>
        <Link href={`/staff/workers/${id}`} className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Worker
        </Link>
      </div>

      {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
      {error && <div className="p-6 text-sm text-red-500">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-gray-500 text-sm mb-2">Completed Jobs</div>
              <div className="text-3xl font-bold text-gray-900">{data.stats.totalCompleted}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-gray-500 text-sm mb-2">Rated Jobs</div>
              <div className="text-3xl font-bold text-gray-900">{data.stats.ratedCount}</div>
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

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">ID</div>
              <div className="col-span-5">Property</div>
              <div className="col-span-3">Cost</div>
              <div className="col-span-2">Rating</div>
            </div>
            {data.recentOrders.length === 0 && <div className="p-6 text-sm text-gray-500">No completed orders yet.</div>}
            {data.recentOrders.map((o) => (
              <div key={o.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
                <div className="col-span-2">
                  <Link href={`/staff/work-orders/${o.id}`} className="text-dwellix-500 hover:underline">#{o.id}</Link>
                </div>
                <div className="col-span-5 text-gray-700">{o.property || "-"}</div>
                <div className="col-span-3 text-gray-700">{o.cost ?? "-"}</div>
                <div className="col-span-2 text-gray-700">{o.rating ?? "-"}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
