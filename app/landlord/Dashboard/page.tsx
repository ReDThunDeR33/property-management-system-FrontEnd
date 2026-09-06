import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

export const dynamic = "force-dynamic";

const dashboardSummarySchema = z.object({
  total_properties: z.union([z.string(), z.number()]),
  total_tenants: z.union([z.string(), z.number()]),
  total_work_orders: z.union([z.string(), z.number()]),
  total_income: z.union([z.string(), z.number(), z.null()]),
});

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user")?.value;
  const token = cookieStore.get("access_token")?.value;

  if (!userCookie || !token) {
    redirect("/login");
  }

  let landlordId: number | null = null;
  try {
    landlordId = JSON.parse(decodeURIComponent(userCookie))?.id ?? null;
  } catch (err) {
    console.error("Error parsing user cookie:", err);
  }

  if (!landlordId) {
    return (
      <Layout>
        <p className="text-red-500">Could not find landlord id.</p>
      </Layout>
    );
  }

  let errorMessage = "";
  let cards: { label: string; value: string }[] = [];

  try {
    const response = await api.get("/landlord/dashboard/summery", {
      params: { landlordId },
    });

    const raw = Array.isArray(response.data) ? response.data[0] : response.data;
    const result = dashboardSummarySchema.safeParse(raw);

    if (!result.success) {
      errorMessage = "Dashboard data came back in an unexpected shape.";
    } else {
      const summary = result.data;
      cards = [
        { label: "Total Properties", value: String(summary.total_properties) },
        { label: "Total Tenants", value: String(summary.total_tenants) },
        { label: "Total Work Orders", value: String(summary.total_work_orders) },
        { label: "Total Income", value: `$${Number(summary.total_income).toLocaleString()}` },
      ];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const backendMessage = error.response?.data?.message;
      if (Array.isArray(backendMessage)) {
        errorMessage = backendMessage[0];
      } else if (typeof backendMessage === "string") {
        errorMessage = backendMessage;
      } else if (!error.response) {
        errorMessage = "Cannot connect to the backend";
      } else {
        errorMessage = "Could not load dashboard summary";
      }
    } else {
      errorMessage = "Something went wrong";
    }
  }

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• OVERVIEW</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-gray-500 mt-2">Summary of your properties, tenants, work orders, and income.</p>
        </div>

        {errorMessage && <p className="text-red-500">{errorMessage}</p>}

        {!errorMessage && (
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