"use client";

import { useEffect, useState } from "react";
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

const tenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  nid_number: z.string(),
  nid_document_url: z.string(),
  has_vehicle: z.boolean(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  created_at: z.string(),
});

const tenantListSchema = z.array(tenantSchema);
type Tenant = z.infer<typeof tenantSchema>;

const statusStyle: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-600",
  APPROVED: "bg-green-50 text-green-600",
  REJECTED: "bg-red-50 text-red-600",
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [landlordId, setLandlordId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actingOn, setActingOn] = useState<number | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
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
        const response = await api.get(`/landlord/tenants/${id}`);
        const result = tenantListSchema.safeParse(response.data);

        if (!result.success) {
          setErrorMessage("Tenant data came back in an unexpected shape.");
          setLoading(false);
          return;
        }

        setTenants(result.data);
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
            setErrorMessage("Could not load tenants");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleApprove = async (tenantId: number) => {
    if (!landlordId) return;
    setActionMessage("");
    setActingOn(tenantId);

    try {
      const response = await api.patch(`/landlord/tenant/approve/${landlordId}/${tenantId}`);
      setTenants((prev) =>
        prev.map((tenant) => (tenant.id === tenantId ? { ...tenant, status: response.data.status } : tenant))
      );
      setActionMessage("Tenant approved.");
    } catch (error) {
      setActionMessage("Could not approve tenant.");
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (tenantId: number) => {
    if (!landlordId) return;
    const confirmed = window.confirm("Reject this tenant application?");
    if (!confirmed) return;

    setActionMessage("");
    setActingOn(tenantId);

    try {
      const response = await api.patch(`/landlord/tenant/reject/${landlordId}/${tenantId}`);
      setTenants((prev) =>
        prev.map((tenant) => (tenant.id === tenantId ? { ...tenant, status: response.data.status } : tenant))
      );
      setActionMessage("Tenant rejected.");
    } catch (error) {
      setActionMessage("Could not reject tenant.");
    } finally {
      setActingOn(null);
    }
  };

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• TENANT MANAGEMENT</p>
          <h1 className="text-3xl font-semibold">Tenants</h1>
          <p className="text-gray-500 mt-2">Review applications and manage approved tenants.</p>
        </div>

        {loading && <p className="text-gray-500">Loading tenants...</p>}
        {!loading && errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {actionMessage && <p className="text-green-600 mb-4">{actionMessage}</p>}

        {!loading && !errorMessage && tenants.length === 0 && (
          <p className="text-gray-500">No tenants found.</p>
        )}

        {!loading && !errorMessage && tenants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">{tenant.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[tenant.status]}`}>
                    {tenant.status}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">{tenant.email}</p>
                <p className="text-gray-500 text-sm">{tenant.phone}</p>
                <p className="text-gray-500 text-sm mt-2">NID: {tenant.nid_number}</p>
                <p className="text-gray-500 text-sm">Vehicle: {tenant.has_vehicle ? "Yes" : "No"}</p>

                {tenant.status === "PENDING" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleApprove(tenant.id)}
                      disabled={actingOn === tenant.id}
                      className="flex-1 bg-[#FF5A3D] text-white text-sm py-2 rounded-lg"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(tenant.id)}
                      disabled={actingOn === tenant.id}
                      className="flex-1 border border-gray-300 text-gray-600 text-sm py-2 rounded-lg"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}