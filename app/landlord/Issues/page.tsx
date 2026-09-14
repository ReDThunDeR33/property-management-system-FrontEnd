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
  description: z.string().optional(),
  image_url: z.string().nullable().optional(),
  created_at: z.string(),
  // property relation returned with the issue
  property: z
    .object({
      id: z.number(),
    })
    .nullable()
    .optional(),
});

const issueListSchema = z.array(issueSchema);
type Issue = z.infer<typeof issueSchema>;

const propertySchema = z.object({
  id: z.number(),
});
const propertyListSchema = z.array(propertySchema);
type Property = z.infer<typeof propertySchema>;

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

// The next status an issue can move to, in order: OPEN -> IN_PROGRESS -> RESOLVED.
// RESOLVED is a terminal state (nothing to move to next).
const nextStatus: Record<string, (typeof issueStatuses)[number] | null> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
};

const nextStatusButtonLabel: Record<string, string> = {
  OPEN: "Mark In Progress",
  IN_PROGRESS: "Mark Complete",
};

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [landlordId, setLandlordId] = useState<number | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");

  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // ----- status update state -----
  const [updatingIssueId, setUpdatingIssueId] = useState<number | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData = getCookie("user");
      if (!userData) {
        setErrorMessage("You are not logged in.");
        setLoading(false);
        setPropertiesLoading(false);
        return;
      }

      let parsedLandlordId: number | null = null;
      try {
        parsedLandlordId = JSON.parse(userData)?.id ?? null;
      } catch (err) {
        console.error("Error parsing user cookie:", err);
      }

      if (!parsedLandlordId) {
        setErrorMessage("Could not find landlord id.");
        setLoading(false);
        setPropertiesLoading(false);
        return;
      }

      setLandlordId(parsedLandlordId);

      try {
        const response = await api.get(`/landlord/issues/${parsedLandlordId}`);
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

      try {
        setPropertiesLoading(true);
        setPropertiesError("");
        const propRes = await api.get(`/landlord/properties/${parsedLandlordId}`);
        const propResult = propertyListSchema.safeParse(propRes.data);

        if (!propResult.success) {
          setPropertiesError("Property data came back in an unexpected shape.");
          return;
        }

        setProperties(propResult.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const backendMessage = error.response?.data?.message;
          if (Array.isArray(backendMessage)) {
            setPropertiesError(backendMessage[0]);
          } else if (typeof backendMessage === "string") {
            setPropertiesError(backendMessage);
          } else if (!error.response) {
            setPropertiesError("Cannot connect to the backend");
          } else {
            setPropertiesError("Could not load properties");
          }
        } else {
          setPropertiesError("Something went wrong");
        }
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!landlordId) {
      setCreateError("Could not find landlord id.");
      return;
    }

    if (!description.trim()) {
      setCreateError("Description is required.");
      return;
    }

    if (!selectedPropertyId) {
      setCreateError("Please select a property.");
      return;
    }

    setCreating(true);

    try {
      const payload = {
        description: description.trim(),
        image_url: imageUrl.trim() || undefined,
        property: Number(selectedPropertyId), // matches CreateIssueDto.property
      };

      const response = await api.post(`/landlord/issues/${landlordId}`, payload);

      const result = issueSchema.safeParse(response.data);

      if (result.success) {
        setIssues((prev) => [result.data, ...prev]);
      } else {
        // fallback: refetch if the POST response shape is unexpected
        const refreshed = await api.get(`/landlord/issues/${landlordId}`);
        const refreshedResult = issueListSchema.safeParse(refreshed.data);
        if (refreshedResult.success) {
          setIssues(refreshedResult.data);
        }
      }

      setCreateSuccess("Issue created successfully.");
      setDescription("");
      setImageUrl("");
      setSelectedPropertyId("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (Array.isArray(backendMessage)) {
          setCreateError(backendMessage[0]);
        } else if (typeof backendMessage === "string") {
          setCreateError(backendMessage);
        } else if (!error.response) {
          setCreateError("Cannot connect to the backend");
        } else {
          setCreateError("Could not create issue");
        }
      } else {
        setCreateError("Something went wrong");
      }
    } finally {
      setCreating(false);
    }
  };

 
  const handleAdvanceStatus = async (issue: Issue) => {
    const target = nextStatus[issue.status];
    if (!landlordId || !target) return;

    setStatusUpdateError((prev) => ({ ...prev, [issue.id]: "" }));
    setUpdatingIssueId(issue.id);

    try {
      const response = await api.patch(`/landlord/issues/${landlordId}/${issue.id}`, {
        status: target,
      });

      const result = issueSchema.safeParse(response.data);

      if (result.success) {
        setIssues((prev) => prev.map((i) => (i.id === issue.id ? result.data : i)));
      } else {
        const refreshed = await api.get(`/landlord/issues/${landlordId}`);
        const refreshedResult = issueListSchema.safeParse(refreshed.data);
        if (refreshedResult.success) {
          setIssues(refreshedResult.data);
        }
      }
    } catch (error) {
      let message = "Could not update issue status";
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (Array.isArray(backendMessage)) {
          message = backendMessage[0];
        } else if (typeof backendMessage === "string") {
          message = backendMessage;
        } else if (!error.response) {
          message = "Cannot connect to the backend";
        }
      } else {
        message = "Something went wrong";
      }
      setStatusUpdateError((prev) => ({ ...prev, [issue.id]: message }));
    } finally {
      setUpdatingIssueId(null);
    }
  };

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

        {/* Create Issue form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Create Issue</h2>
          <form onSubmit={handleCreateIssue} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Property</label>
              {propertiesLoading ? (
                <p className="text-gray-500 text-sm">Loading properties...</p>
              ) : propertiesError ? (
                <p className="text-red-500 text-sm">{propertiesError}</p>
              ) : (
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      Property #{property.id}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Describe the issue..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Image URL (optional)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>

            {createError && <p className="text-red-500 text-sm">{createError}</p>}
            {createSuccess && <p className="text-green-600 text-sm">{createSuccess}</p>}

            <button
              type="submit"
              disabled={creating}
              className="text-sm px-4 py-2 rounded-lg bg-[#FF5A3D] text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Issue"}
            </button>
          </form>
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
            {filteredIssues.map((issue) => {
              const target = nextStatus[issue.status];
              const isUpdating = updatingIssueId === issue.id;

              return (
                <div key={issue.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Issue #{issue.id}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[issue.status]}`}>
                      {statusLabel[issue.status]}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    {issue.property?.id ? `Property #${issue.property.id}` : "No property linked"}
                  </p>
                  {issue.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-3">{issue.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-3">
                    Reported {new Date(issue.created_at).toLocaleDateString()}
                  </p>

                  {statusUpdateError[issue.id] && (
                    <p className="text-red-500 text-xs mt-2">{statusUpdateError[issue.id]}</p>
                  )}

                  {target && (
                    <button
                      onClick={() => handleAdvanceStatus(issue)}
                      disabled={isUpdating}
                      className="mt-4 w-full text-xs px-3 py-2 rounded-lg bg-[#FF5A3D] text-white disabled:opacity-50"
                    >
                      {isUpdating ? "Updating..." : nextStatusButtonLabel[issue.status]}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
