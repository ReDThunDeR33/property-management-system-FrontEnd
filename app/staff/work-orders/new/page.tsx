"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { authHeader, getClientUser } from "@/lib/getToken";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [propertyId, setPropertyId] = useState(searchParams.get("property_id") || "");
  const [issueId, setIssueId] = useState(searchParams.get("issue_id") || "");
  const [landlordId, setLandlordId] = useState(searchParams.get("landlord_id") || "");
  const [tenantId, setTenantId] = useState(searchParams.get("tenant_id") || "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const user = getClientUser();
    const staffId = user?.id || 1;

    await api.post(
      `/staff/work-orders?staffId=${staffId}`,
      {
        property_id: Number(propertyId),
        issue_id: Number(issueId),
        landlord_id: Number(landlordId),
        tenant_id: tenantId ? Number(tenantId) : undefined,
        created_by_type: "staff",
        created_by_id: staffId,
      },
      { headers: authHeader() }
    );
    router.push("/staff/work-orders");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2
          className="text-2xl font-bold"
          style={{ color: "#ff5a3d" }}
        >
          Create Work Order
        </h2>
        <Link href="/staff/work-orders" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Work Orders
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
          <input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue ID</label>
          <input value={issueId} onChange={(e) => setIssueId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Landlord ID</label>
          <input value={landlordId} onChange={(e) => setLandlordId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID (optional)</label>
          <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-white rounded-lg text-sm font-medium active:scale-95 transition-all duration-150 shadow-sm"
          style={{ backgroundColor: "#ff5a3d" }}
        >
          Add Worke Order
        </button>
      </form>
    </div>
  );
}
