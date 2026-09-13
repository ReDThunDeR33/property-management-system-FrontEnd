"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../../Components/Layout";
import api from "../../../../lib/axios";
import ResolveIssueButton from "./ResolveIssueButton";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

const issueStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

const issueSchema = z.object({
  id: z.number(),
  tenant: z.object({
    id: z.number(),
    name: z.string(),
    phone: z.string(),
  }),
  description: z.string(),
  image_url: z.union([z.string(), z.null()]).optional(),
  status: z.enum(issueStatuses),
  created_at: z.string(),
});

type Issue = z.infer<typeof issueSchema>;

const statusStyle: Record<string, string> = {
  OPEN: "bg-yellow-50 text-yellow-600",
  IN_PROGRESS: "bg-blue-50 text-blue-600",
  RESOLVED: "bg-green-50 text-green-600",
};

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export default function IssueDetailsPage() {
  const params = useParams();

  const issueId = Number(params.id);

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchIssue = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData = getCookie("user");

      if (!userData) {
        setErrorMessage("You are not logged in.");
        setLoading(false);
        return;
      }

      let tenantId: number | null = null;

      try {
        tenantId = JSON.parse(userData)?.id ?? null;
      } catch (err) {
        console.error("Error parsing user cookie:", err);
      }

      if (!tenantId) {
        setErrorMessage("Could not find tenant id.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/tenant/issues/${issueId}`);

        const result = issueSchema.safeParse(response.data);

        if (!result.success) {
          setErrorMessage(
            "Issue data came back in an unexpected shape."
          );
          setLoading(false);
          return;
        }

        if (result.data.tenant.id !== tenantId) {
          setErrorMessage("You cannot view this issue.");
          setLoading(false);
          return;
        }

        setIssue(result.data);
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
            setErrorMessage("Could not load issue");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    if (issueId) {
      fetchIssue();
    }
  }, [issueId]);

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• ISSUE TRACKING</p>

          <h1 className="text-3xl font-semibold">Issue Details</h1>

          <p className="text-gray-500 mt-2">
            View information about your reported maintenance issue.
          </p>
        </div>

        {loading && (
          <p className="text-gray-500">Loading issue...</p>
        )}

        {!loading && errorMessage && (
          <p className="text-red-500">{errorMessage}</p>
        )}

        {!loading && !errorMessage && issue && (
          <div className="max-w-3xl bg-white border border-gray-200 rounded-xl p-6">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Issue #{issue.id}
                </h2>

                <p className="text-gray-400 text-xs mt-2">
                  Reported{" "}
                  {new Date(issue.created_at).toLocaleDateString()}
                </p>
              </div>

              <span
                className={`text-xs px-3 py-1.5 rounded-full ${
                  statusStyle[issue.status]
                }`}
              >
                {statusLabel[issue.status]}
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">
                Description
              </p>

              <p className="text-gray-700">
                {issue.description}
              </p>
            </div>

            {issue.image_url && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">
                  Issue Image
                </p>

                <div className="w-full max-w-lg h-64 bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={issue.image_url}
                    alt={`Issue ${issue.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">

                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">
                    Tenant
                  </span>

                  <span className="text-sm font-medium">
                    {issue.tenant.name}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">
                    Phone
                  </span>

                  <span className="text-sm font-medium">
                    {issue.tenant.phone}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">
                    Status
                  </span>

                  <span className="text-sm font-medium">
                    {statusLabel[issue.status]}
                  </span>
                </div>
              </div>
            </div>

            <ResolveIssueButton
              issueId={issue.id}
              status={issue.status}
            />
          </div>
        )}
      </section>
    </Layout>
  );
}