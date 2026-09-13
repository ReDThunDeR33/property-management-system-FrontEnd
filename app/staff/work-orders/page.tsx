"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const workOrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  landlord: z.object({ id: z.number(), name: z.string() }).nullable(),
  property: z.object({ id: z.number(), unit_number: z.string() }).nullable(),
  tenant: z.object({ id: z.number(), name: z.string() }).nullable(),
});

const responseSchema = z.object({ data: z.array(workOrderSchema) });

type WorkOrder = z.infer<typeof workOrderSchema>;

async function getWorkOrders(): Promise<WorkOrder[]> {
  const res = await api.get("/staff/work-orders", { headers: authHeader() });
  const parsed = responseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getWorkOrders()
      .then((data) => {
        setOrders(data);
      })
      .catch(() => {
        setErrorMessage("Could not load work orders");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage, dispatch, and complete maintenance requests.</p>
        </div>
        <Link
          href="/staff/work-orders/new"
          className="inline-block px-4 py-2 bg-[#ff5a3d] text-white rounded-lg text-sm font-medium hover:bg-[#e64a32] active:scale-95 transition-all duration-150 shadow-sm"        >
          + Create Work Order
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">ID</div>
          <div className="col-span-2">Property</div>
          <div className="col-span-2">Landlord</div>
          <div className="col-span-2">Tenant</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!loading && errorMessage && <div className="p-6 text-sm text-red-500">{errorMessage}</div>}
        {!loading && !errorMessage && orders.length === 0 && <div className="p-6 text-sm text-gray-500">No work orders found.</div>}
        {!loading && orders.map((order) => (
          <div key={order.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-1 text-gray-900 font-medium">#{order.id}</div>
            <div className="col-span-2 text-gray-700">
              {order.property ? (
                <div><div>{order.property.unit_number}</div><div className="text-xs text-gray-400">Property ID: {order.property.id}</div></div>
              ) : "-"}
            </div>
            <div className="col-span-2 text-gray-700">
              {order.landlord ? (
                <div><div>{order.landlord.name}</div><div className="text-xs text-gray-400">Landlord ID: {order.landlord.id}</div></div>
              ) : "-"}
            </div>
            <div className="col-span-2 text-gray-700">
              {order.tenant ? (
                <div><div>{order.tenant.name}</div><div className="text-xs text-gray-400">Tenant ID: {order.tenant.id}</div></div>
              ) : "-"}
            </div>
            <div className="col-span-3">
              <span className={`bg-${statusColor(order.status)}-100 text-${statusColor(order.status)}-600 text-xs px-3 py-1 rounded-full`}>
                {order.status}
              </span>
            </div>
            <div className="col-span-2 text-right">
              <Link href={`/staff/work-orders/${order.id}`} className="text-dwellix-500 text-sm font-medium hover:underline">
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
