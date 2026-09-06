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

const issueStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

const issueSchema = z.object({
  id: z.number(),
  status: z.enum(issueStatuses),
  created_at: z.string(),
});

const issueListSchema = z.array(issueSchema);
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

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchIssues = async () => {
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
        landlordId = JSON.parse(userData)?.id ?? null;
      } catch (err) {
        console.error("Error parsing user cookie:", err);
      }

      if (!landlordId) {
        setErrorMessage("Could not find landlord id.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/landlord/issues/${landlordId}`);
        const result = issueListSchema.safeParse(response.data);

        if (!result.success) {
          setErrorMessage("Issue data came back in an unexpected shape.");
          setLoading(false);
          return;
        }

        setIssues(result.data);
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
            setErrorMessage("Could not load issues");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const filteredIssues =
    statusFilter === "all" ? issues : issues.filter((issue) => issue.status === statusFilter);

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• ISSUE TRACKING</p>
          <h1 className="text-3xl font-semibold">Reported Issues</h1>
          <p className="text-gray-500 mt-2">Tenants report issues, issues are linked to property and can generate work order.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              statusFilter === "all"
                ? "bg-[#FF5A3D] text-white border-[#FF5A3D]"
                : "border-gray-300 text-gray-600"
            }`}
          >
            All
          </button>
          {issueStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                statusFilter === s
                  ? "bg-[#FF5A3D] text-white border-[#FF5A3D]"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-500">Loading issues...</p>}
        {!loading && errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {!loading && !errorMessage && filteredIssues.length === 0 && (
          <p className="text-gray-500">No issues found.</p>
        )}

        {!loading && !errorMessage && filteredIssues.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Issue #{issue.id}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[issue.status]}`}>
                    {statusLabel[issue.status]}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-3">
                  Reported {new Date(issue.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}