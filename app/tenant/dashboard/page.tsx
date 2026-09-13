"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import Link from "next/link";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() || "",
    );
  }

  return null;
}

const dashboardSchema = z.object({
  open_issues: z.union([z.string(), z.number()]),
  // completed_work_orders: z.union([z.string(), z.number()]),
  total_due: z.union([z.string(), z.number()]),
  total_paid: z.union([z.string(), z.number()]),
});

type DashboardData = z.infer<typeof dashboardSchema>;

export default function TenantDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [name, setName] = useState("Tenant");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const userCookie = getCookie("user");

        if (!userCookie) {
          setError("User information not found.");
          return;
        }

        const user = JSON.parse(userCookie);
        const accountTypeCookie = getCookie("account_type");
        if (accountTypeCookie && accountTypeCookie !== "tenant") {
          setError("Unauthorized access. Please log in as tenant.");
          return;
        }

        const tenantId = user.id;

        setName(user.name || "Tenant");

        const response = await api.get(
          `/tenant/dashboard/summery?tenantId=${tenantId}`,
        );

        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        const result = dashboardSchema.safeParse(data);

        if (!result.success) {
          setError("Invalid dashboard data.");
          return;
        }

        setDashboard(result.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Failed to load dashboard.",
          );
        } else {
          setError("Failed to load dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const money = (value: string | number) =>
    Number(value || 0).toLocaleString("en-BD");

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-[#FF5A3D]">
            Tenant Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Welcome back, {name}
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your payments, maintenance issues and property
            information.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6">
            Loading dashboard...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {dashboard && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Due
                </p>

                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  ৳{money(dashboard.total_due)}
                </h2>

                <Link
                  href="/tenant/payments"
                  className="mt-4 inline-block text-sm font-medium text-[#FF5A3D]"
                >
                  View Payments →
                </Link>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Paid
                </p>

                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  ৳{money(dashboard.total_paid)}
                </h2>

                <Link
                  href="/tenant/payments"
                  className="mt-4 inline-block text-sm font-medium text-[#FF5A3D]"
                >
                  Payment History →
                </Link>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Open Issues
                </p>

                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  {dashboard.open_issues}
                </h2>

                <Link
                  href="/tenant/issues"
                  className="mt-4 inline-block text-sm font-medium text-[#FF5A3D]"
                >
                  View Issues →
                </Link>
              </div>

              {/* <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Completed Work Orders
                </p>

                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  {dashboard.completed_work_orders}
                </h2>

                <Link
                  href="/tenant/work-orders"
                  className="mt-4 inline-block text-sm font-medium text-[#FF5A3D]"
                >
                  View Work Orders →
                </Link>
              </div> */}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/tenant/issues/new"
                    className="rounded-xl bg-[#FF5A3D] px-4 py-3 text-center font-medium text-white"
                  >
                    Report Issue
                  </Link>

                  <Link
                    href="/tenant/payments"
                    className="rounded-xl border px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Make Payment
                  </Link>

                  <Link
                    href="/tenant/property"
                    className="rounded-xl border px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
                  >
                    My Property
                  </Link>

                  <Link
                    href="/tenant/profile"
                    className="rounded-xl border px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
                  >
                    My Profile
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Account Summary
                </h2>

                <div className="mt-5 space-y-4">
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-gray-500">
                      Outstanding Payment
                    </span>
                    <span className="font-semibold">
                      ৳{money(dashboard.total_due)}
                    </span>
                  </div>

                  <div className="flex justify-between border-b pb-3">
                    <span className="text-gray-500">
                      Open Issues
                    </span>
                    <span className="font-semibold">
                      {dashboard.open_issues}
                    </span>
                  </div>

                  {/* <div className="flex justify-between">
                    <span className="text-gray-500">
                      Completed Maintenance
                    </span>
                    <span className="font-semibold">
                      {dashboard.completed_work_orders}
                    </span>
                  </div> */}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}