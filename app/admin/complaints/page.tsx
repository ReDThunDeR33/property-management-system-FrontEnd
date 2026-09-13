"use client";

/* ============================================================
   ADMIN COMPLAINT CENTER — app/admin/complaints/page.tsx
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. CLIENT-SIDE RENDERING (CSR) — course table:
      "Search page with filters -> CSR" and "Admin panel -> CSR".
      This page is the perfect CSR fit: status/type filters and a
      keyword search box update the list instantly from browser
      state without reloading the page.

   2. REACT HOOKS:
      - useState  -> list data, filter selections, search box,
        loading and error flags.
      - useEffect -> loads all complaints once on mount.

   3. AXIOS — axios imported directly, backend URL from
      NEXT_PUBLIC_API_URL in .env.local (course convention).
      GET /admin/complaint/allcomplaints (initial load)
      and GET /admin/complaint/search?keyword=... (keyword search
      with Axios query params — the "Axios GET with parameter"
      pattern from the course slides). JWT via authHeader().
      fetch() is never used.

   4. DYNAMIC ROUTING LINKS — each row links to the dynamic
      detail route /admin/complaints/[id] (Next 15/16 style:
      id is awaited in that page's params).

   5. DAISYUI — table, select, badge, alert components.

   6. FOLDER-BASED ROUTING — app/admin/complaints/page.tsx.
   ============================================================ */

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { authHeader } from "@/lib/getToken";

// One complaint as returned by the backend (matches the entity).
type Complaint = {
  id: number;
  filed_by_type: string;
  filed_by_id: number;
  against_type: string;
  against_id: number | null;
  description: string;
  status: string;
  admin_note: string | null;
  reviewed_by: { id: number; name: string } | null;
  created_at: string;
};

// Filter options (match the backend enum values).
const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const FILER_OPTIONS = ["LANDLORD", "TENANT", "STAFF"];

// Status -> DaisyUI badge color mapping.
const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning",
  IN_PROGRESS: "badge-info",
  RESOLVED: "badge-success",
  REJECTED: "badge-ghost",
};

export default function AdminComplaintsPage() {
  // ----- list state (loaded once on mount via useEffect) -----
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----- filter + search state (CSR interactivity) -----
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filerFilter, setFilerFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);

  /* useEffect: load all complaints once when the page mounts. */
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Axios GET — all complaints (JWT protected route).
  async function fetchComplaints() {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/complaint/allcomplaints",
        { headers: authHeader() },
      );
      setComplaints(response.data);
    } catch {
      setError("Could not load complaints. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  /* Keyword search through the backend search endpoint.
     Demonstrates Axios GET with a query parameter (params option). */
  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = keyword.trim();
    if (!trimmed) {
      // empty keyword -> just reload everything
      fetchComplaints();
      return;
    }

    try {
      setSearching(true);
      setError("");
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/complaint/search",
        {
          params: { keyword: trimmed }, // Axios query params
          headers: authHeader(),
        },
      );
      setComplaints(response.data);
    } catch {
      setError("Search failed. Is the backend running?");
    } finally {
      setSearching(false);
    }
  }

  // Clear the search box and reload the full list.
  function handleClearSearch() {
    setKeyword("");
    fetchComplaints();
  }

  /* Client-side filtering (CSR): status + filer type are applied
     instantly in the browser from the loaded list. */
  const filteredComplaints = complaints.filter((complaint) => {
    const statusOk = statusFilter === "ALL" || complaint.status === statusFilter;
    const filerOk = filerFilter === "ALL" || complaint.filed_by_type === filerFilter;
    return statusOk && filerOk;
  });

  // ---- render -------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Complaint Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review, inspect and resolve complaints filed by landlords, tenants and staff.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-error">{error}</span>
          <button className="btn btn-xs" onClick={fetchComplaints}>
            Retry
          </button>
        </div>
      )}

      {/* Filter bar (CSR: instant client-side filtering) */}
      <div className="card border border-base-300 bg-white shadow-sm">
        <div className="card-body flex-row flex-wrap items-end gap-4 p-4">
          {/* Status filter */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Status
            </label>
            <select
              className="select select-bordered select-sm w-40"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Filer type filter */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Filed by
            </label>
            <select
              className="select select-bordered select-sm w-40"
              value={filerFilter}
              onChange={(event) => setFilerFilter(event.target.value)}
            >
              <option value="ALL">All roles</option>
              {FILER_OPTIONS.map((filer) => (
                <option key={filer} value={filer}>
                  {filer}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword search (Axios GET with query param) */}
          <form onSubmit={handleSearch} className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Search
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search descriptions..."
                className="input input-bordered input-sm w-56"
              />
            </div>
            <button type="submit" className="btn btn-sm" disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleClearSearch}>
              Clear
            </button>
          </form>
        </div>
      </div>

      {/* List area */}
      {loading ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body space-y-3">
            <div className="h-4 w-48 animate-pulse rounded bg-base-300" />
            <div className="h-4 w-full animate-pulse rounded bg-base-300" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-base-300" />
          </div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body items-center text-center">
            <p className="text-sm text-gray-500">No complaints match the current filters.</p>
          </div>
        </div>
      ) : (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            {/* DaisyUI table */}
            <table className="table">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th>#</th>
                  <th>Filed by</th>
                  <th>Against</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>{complaint.id}</td>
                    <td>
                      <span className="font-semibold">{complaint.filed_by_type}</span>
                      <span className="text-gray-400"> #{complaint.filed_by_id}</span>
                    </td>
                    <td>
                      <span className="font-semibold">{complaint.against_type}</span>
                      <span className="text-gray-400">
                        {complaint.against_id ? ` #${complaint.against_id}` : ""}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <p className="line-clamp-1 text-sm text-gray-500">
                        {complaint.description}
                      </p>
                    </td>
                    {/* DaisyUI badge with per-status color */}
                    <td>
                      <span className={`badge badge-sm ${STATUS_BADGE[complaint.status] ?? "badge-ghost"}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </td>
                    {/* Link to the dynamic detail route /admin/complaints/[id] */}
                    <td className="text-right">
                      <Link
                        href={`/admin/complaints/${complaint.id}`}
                        className="btn btn-ghost btn-xs text-dwellix-500"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
