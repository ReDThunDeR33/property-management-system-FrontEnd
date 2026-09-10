"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const propertySchema = z.object({
  id: z.number(),
  unit_number: z.string(),
  rent_amount: z.coerce.number().nullable(),
  status: z.string().nullable(),
  landlord: z.object({ name: z.string() }).nullable(),
  tenant: z.object({ name: z.string() }).nullable(),
});

type Property = z.infer<typeof propertySchema>;

async function getProperty(id: string): Promise<Property | null> {
  const res = await api.get(`/staff/properties/${id}`, { headers: authHeader() });
  const parsed = propertySchema.safeParse(res.data);
  return parsed.success ? parsed.data : null;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    getProperty(id).then(setProperty);
  }, [id]);

  if (!property) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Unit {property.unit_number}</h2>
        <Link href="/staff/properties" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Properties
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Landlord</div>
          <div className="text-gray-900 font-medium">{property.landlord ? property.landlord.name : "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Tenant</div>
          <div className="text-gray-900 font-medium">{property.tenant ? property.tenant.name : "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Rent</div>
          <div className="text-gray-900 font-medium">{property.rent_amount ?? "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Status</div>
          <div className="text-gray-900 font-medium">{property.status || "-"}</div>
        </div>
      </div>
    </div>
  );
}
