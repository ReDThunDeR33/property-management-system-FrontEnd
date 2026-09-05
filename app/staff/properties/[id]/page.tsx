"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";
import { statusColor } from "@/lib/status";

const propertyDetailSchema = z.object({
  id: z.number(),
  unit_number: z.string(),
  rent_amount: z.coerce.number().optional(),
  service_charge: z.coerce.number().optional(),
  has_parking: z.boolean().optional(),
  parking_fee: z.coerce.number().optional(),
  listing_status: z.string().optional(),
  status: z.string().optional(),
  landlord: z.object({ id: z.number(), name: z.string(), email: z.string().optional(), phone: z.string().optional() }).nullable().optional(),
  tenant: z.object({ id: z.number(), name: z.string(), email: z.string().optional() }).nullable().optional(),
  workOrders: z.array(z.object({ id: z.number(), status: z.string() })).optional().default([]),
});

type PropertyDetail = z.infer<typeof propertyDetailSchema>;

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/staff/properties/${id}`, { headers: authHeader() });
        const parsed = propertyDetailSchema.safeParse(res.data);
        if (!parsed.success) {
          setError("Invalid data received from server");
          return;
        }
        setProperty(parsed.data);
      } catch {
        setError("Failed to load property");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (error && !property) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!property) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Unit {property.unit_number}</h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className={`inline-block bg-${statusColor(property.status || "")}-100 text-${statusColor(property.status || "")}-600 text-xs px-3 py-1 rounded-full`}>
              {property.status}
            </span>
          </p>
        </div>
        <Link href="/staff/properties" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Properties
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Landlord</div>
          <div className="text-gray-900 font-medium">{property.landlord?.name || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Tenant</div>
          <div className="text-gray-900 font-medium">{property.tenant?.name || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Rent</div>
          <div className="text-gray-900 font-medium">{property.rent_amount ?? "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Service Charge</div>
          <div className="text-gray-900 font-medium">{property.service_charge ?? "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Parking</div>
          <div className="text-gray-900 font-medium">{property.has_parking ? `Yes (${property.parking_fee ?? 0})` : "No"}</div>
        </div>
        <div>
          <div className="text-gray-500">Listing</div>
          <div className="text-gray-900 font-medium">{property.listing_status || "-"}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Work Orders</h3>
        </div>
        {property.workOrders.length === 0 && <div className="p-6 text-sm text-gray-500">No work orders for this property.</div>}
        {property.workOrders.map((wo) => (
          <div key={wo.id} className="flex justify-between items-center p-4 border-b border-gray-100 text-sm">
            <div className="text-gray-900">#{wo.id}</div>
            <span className={`bg-${statusColor(wo.status)}-100 text-${statusColor(wo.status)}-600 text-xs px-3 py-1 rounded-full`}>{wo.status}</span>
            <Link href={`/staff/work-orders/${wo.id}`} className="text-dwellix-500 hover:underline">View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
