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

const dashboardSummarySchema = z.object({
  total_properties: z.union([z.string(), z.number()]),
  total_tenants: z.union([z.string(), z.number()]),
  total_work_orders: z.union([z.string(), z.number()]),
  total_income: z.union([z.string(), z.number(), z.null()]),
});

type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData = getCookie("user");
      if (!userData) {
        setErrorMessage("You are not logged in.");
        setLoading(false);
        return;
      }

      let landlordId: number | null = null;
      try {
        const parsedUser = JSON.parse(userData);
        landlordId = parsedUser?.id ?? null;
      } catch (err) {
        console.error("Error parsing user cookie:", err);
      }

      if (!landlordId) {
        setErrorMessage("Could not find landlord id.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/landlord/dashboard/summery", {
          params: { landlordId },
        });

        const raw = Array.isArray(response.data) ? response.data[0] : response.data;
        const result = dashboardSummarySchema.safeParse(raw);

        if (!result.success) {
          setErrorMessage("Dashboard data came back in an unexpected shape.");
          setLoading(false);
          return;
        }

        setSummary(result.data);
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
            setErrorMessage("Could not load dashboard summary");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const cards = summary
    ? [
        { label: "Total Properties", value: summary.total_properties },
        { label: "Total Tenants", value: summary.total_tenants },
        { label: "Total Work Orders", value: summary.total_work_orders },
        { label: "Total Income", value: `$${Number(summary.total_income).toLocaleString()}` },
      ]
    : [];

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• OVERVIEW</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-gray-500 mt-2">Summary of your properties, tenants, work orders, and income.</p>
        </div>

        {loading && <p className="text-gray-500">Loading dashboard...</p>}

        {!loading && errorMessage && <p className="text-red-500">{errorMessage}</p>}

        {!loading && !errorMessage && summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm">{card.label}</p>
                <p className="text-2xl font-semibold mt-2">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}