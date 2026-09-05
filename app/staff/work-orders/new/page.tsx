"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader, getClientUser } from "@/lib/getToken";

const createWorkOrderSchema = z.object({
  property_id: z.coerce.number().int().positive(),
  issue_id: z.coerce.number().int().positive(),
  landlord_id: z.coerce.number().int().positive(),
  tenant_id: z.coerce.number().int().positive().optional(),
});

export default function NewWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    property_id: searchParams.get("property_id") || "",
    issue_id: searchParams.get("issue_id") || "",
    landlord_id: searchParams.get("landlord_id") || "",
    tenant_id: searchParams.get("tenant_id") || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = createWorkOrderSchema.safeParse({
      property_id: form.property_id,
      issue_id: form.issue_id,
      landlord_id: form.landlord_id,
      tenant_id: form.tenant_id || undefined,
    });
    if (!parsed.success) {
      setError("Please fill Property, Issue, and Landlord with valid numeric IDs.");
      return;
    }

    setSubmitting(true);
    try {
      const user = getClientUser();
      const staffId = user?.id || 1;
      await api.post(
        `/staff/work-orders?staffId=${staffId}`,
        { ...parsed.data, created_by_type: "staff", created_by_id: staffId },
        { headers: authHeader() }
      );
      router.push("/staff/work-orders");
    } catch {
      setError("Failed to create work order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Work Order</h2>
          <p className="text-sm text-gray-500 mt-1">Convert an issue into a work order.</p>
        </div>
        <Link href="/staff/work-orders" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Work Orders
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-lg">
        {error && <div className="text-sm text-red-500">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
          <input
            value={form.property_id}
            onChange={(e) => setForm({ ...form, property_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue ID</label>
          <input
            value={form.issue_id}
            onChange={(e) => setForm({ ...form, issue_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Landlord ID</label>
          <input
            value={form.landlord_id}
            onChange={(e) => setForm({ ...form, landlord_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID (optional)</label>
          <input
            value={form.tenant_id}
            onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Work Order"}
        </button>
      </form>
    </div>
  );
}
