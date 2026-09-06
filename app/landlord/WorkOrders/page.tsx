"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

const workOrderSchema = z.object({
  id: z.number(),
  created_by_type: z.string(),
  created_by_id: z.number(),
  status: z.string(),
  labor_cost: z.union([z.string(), z.number(), z.null()]),
  materials_cost: z.union([z.string(), z.number(), z.null()]),
  additional_cost: z.union([z.string(), z.number(), z.null()]),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});

const workOrderListSchema = z.array(workOrderSchema);
type WorkOrder = z.infer<typeof workOrderSchema>;

const createWorkOrderSchema = z.object({
  property_id: z.coerce.number().positive("Property ID is required"),
  issue_id: z.coerce.number().positive("Issue ID is required"),
  tenant_id: z.coerce.number().positive("Tenant ID is required"),
  staff_id: z.coerce.number().positive("Staff ID is required"),
  worker_id: z.coerce.number().optional(),
});

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [landlordId, setLandlordId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [propertyId, setPropertyId] = useState("");
  const [issueId, setIssueId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData = getCookie("user");
      if (!userData) {
        setErrorMessage("You are not logged in.");
        setLoading(false);
        return;
      }

      let id: number | null = null;
      try {
        id = JSON.parse(userData)?.id ?? null;
      } catch (err) {
        console.error("Error parsing user cookie:", err);
      }

      if (!id) {
        setErrorMessage("Could not find landlord id.");
        setLoading(false);
        return;
      }
      setLandlordId(id);

      try {
        const response = await api.get(`/landlord/workorders/${id}`);
        const result = workOrderListSchema.safeParse(response.data);

        if (!result.success) {
          setErrorMessage("Work order data came back in an unexpected shape.");
          setLoading(false);
          return;
        }

        setWorkOrders(result.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const backendMessage = error.response?.data?.message;
          if (Array.isArray(backendMessage)) {
            setErrorMessage(backendMessage[0]);
          } else if (typeof backendMessage === "string") {
            setErrorMessage(backendMessage);
          } else if (!error.response) {
            setErrorMessage("Cannot connect to the backend");
          } else {
            setErrorMessage("Could not load work orders");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  const handleCreateWorkOrder = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const result = createWorkOrderSchema.safeParse({
      property_id: propertyId,
      issue_id: issueId,
      tenant_id: tenantId,
      staff_id: staffId,
      worker_id: workerId || undefined,
    });

    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }
    if (!landlordId) return;

    try {
      setCreating(true);
      const response = await api.post(`/landlord/workorder/${landlordId}`, {
        property_id: result.data.property_id,
        issue_id: result.data.issue_id,
        landlord_id: landlordId,
        tenant_id: result.data.tenant_id,
        staff_id: result.data.staff_id,
        worker_id: result.data.worker_id ?? null,
        review_id: null,
        created_by_type: "landlord",
        created_by_id: landlordId,
        status: "pending",
      });

      setWorkOrders((prev) => [response.data, ...prev]);
      setFormSuccess("Work order created.");
      setPropertyId("");
      setIssueId("");
      setTenantId("");
      setStaffId("");
      setWorkerId("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (Array.isArray(backendMessage)) {
          setFormError(backendMessage[0]);
        } else if (typeof backendMessage === "string") {
          setFormError(backendMessage);
        } else if (!error.response) {
          setFormError("Cannot connect to the backend");
        } else {
          setFormError("Could not create work order");
        }
      } else {
        setFormError("Something went wrong");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• MAINTENANCE MANAGEMENT</p>
          <h1 className="text-3xl font-semibold">Work Orders</h1>
          <p className="text-gray-500 mt-2">Create and track work orders from issues.</p>
        </div>

        <form onSubmit={handleCreateWorkOrder} className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Create Work Order</h2>

          {formError && <p className="text-red-500 mb-3">{formError}</p>}
          {formSuccess && <p className="text-green-600 mb-3">{formSuccess}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="number"
              placeholder="Property ID"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="number"
              placeholder="Issue ID"
              value={issueId}
              onChange={(e) => setIssueId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="number"
              placeholder="Tenant ID"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="number"
              placeholder="Staff ID"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="number"
              placeholder="Worker ID (optional)"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-4 bg-[#FF5A3D] text-white px-5 py-2 rounded-lg text-sm"
          >
            {creating ? "Creating..." : "Create Work Order"}
          </button>
        </form>

        {loading && <p className="text-gray-500">Loading work orders...</p>}
        {!loading && errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {!loading && !errorMessage && workOrders.length === 0 && (
          <p className="text-gray-500">No work orders found.</p>
        )}

        {!loading && !errorMessage && workOrders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workOrders.map((order) => (
              <Link
                key={order.id}
                href={`/landlord/WorkOrders/${order.id}`}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#FF5A3D] transition block"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Order #{order.id}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#fff0ed] text-[#FF5A3D]">
                    {order.status}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Labor: ${Number(order.labor_cost ?? 0).toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm">
                  Materials: ${Number(order.materials_cost ?? 0).toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm">
                  Additional: ${Number(order.additional_cost ?? 0).toLocaleString()}
                </p>
                <p className="text-gray-400 text-xs mt-3">
                  Created {new Date(order.created_at).toLocaleDateString()}
                  {order.completed_at ? ` · Completed ${new Date(order.completed_at).toLocaleDateString()}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}