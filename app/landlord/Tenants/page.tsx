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
  property: z
    .object({
      id: z.number(),
      unit_number: z.string(),
      rent_amount: z.union([z.string(), z.number()]),
    })
    .nullable()
    .optional(),
});

const tenantListSchema = z.array(tenantSchema);
type Tenant = z.infer<typeof tenantSchema>;

const statusStyle: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-600",
  APPROVED: "bg-green-50 text-green-600",
  REJECTED: "bg-red-50 text-red-600",
};

const assignPropertySchema = z.coerce.number().positive("Enter a valid property ID");

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [landlordId, setLandlordId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actingOn, setActingOn] = useState<number | null>(null);

  const [propertyIdInputs, setPropertyIdInputs] = useState<Record<number, string>>({});
  const [assignErrors, setAssignErrors] = useState<Record<number, string>>({});
  const [assigningOn, setAssigningOn] = useState<number | null>(null);

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

  const handleAssignProperty = async (event: FormEvent, tenantId: number) => {
    event.preventDefault();
    setAssignErrors((prev) => ({ ...prev, [tenantId]: "" }));

    const rawValue = propertyIdInputs[tenantId] ?? "";
    const result = assignPropertySchema.safeParse(rawValue);

    if (!result.success) {
      setAssignErrors((prev) => ({ ...prev, [tenantId]: result.error.issues[0].message }));
      return;
    }
    if (!landlordId) return;

    try {
      setAssigningOn(tenantId);
      const response = await api.patch(
        `/landlord/tenant/assign-property/${landlordId}/${tenantId}`,
        { property_id: result.data }
      );

      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenantId ? { ...tenant, property: response.data.property } : tenant
        )
      );
      setPropertyIdInputs((prev) => ({ ...prev, [tenantId]: "" }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (Array.isArray(backendMessage)) {
          setAssignErrors((prev) => ({ ...prev, [tenantId]: backendMessage[0] }));
        } else if (typeof backendMessage === "string") {
          setAssignErrors((prev) => ({ ...prev, [tenantId]: backendMessage }));
        } else if (!error.response) {
          setAssignErrors((prev) => ({ ...prev, [tenantId]: "Cannot connect to the backend" }));
        } else {
          setAssignErrors((prev) => ({ ...prev, [tenantId]: "Could not assign property" }));
        }
      } else {
        setAssignErrors((prev) => ({ ...prev, [tenantId]: "Something went wrong" }));
      }
    } finally {
      setAssigningOn(null);
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

                {tenant.status === "APPROVED" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {tenant.property ? (
                      <p className="text-sm">
                        Property:{" "}
                        <Link
                          href={`/landlord/Properties/${tenant.property.id}`}
                          className="text-[#FF5A3D] font-medium"
                        >
                          {tenant.property.unit_number}
                        </Link>{" "}
                        <span className="text-gray-500">
                          (${Number(tenant.property.rent_amount).toLocaleString()}/mo)
                        </span>
                      </p>
                    ) : (
                      <form onSubmit={(e) => handleAssignProperty(e, tenant.id)} className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Property ID"
                          value={propertyIdInputs[tenant.id] ?? ""}
                          onChange={(e) =>
                            setPropertyIdInputs((prev) => ({ ...prev, [tenant.id]: e.target.value }))
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                          type="submit"
                          disabled={assigningOn === tenant.id}
                          className="bg-[#FF5A3D] text-white text-sm px-3 py-2 rounded-lg"
                        >
                          {assigningOn === tenant.id ? "Assigning..." : "Assign"}
                        </button>
                      </form>
                    )}
                    {assignErrors[tenant.id] && (
                      <p className="text-red-500 text-xs mt-2">{assignErrors[tenant.id]}</p>
                    )}
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