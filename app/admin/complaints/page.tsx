"use client";

/* ============================================================
   COMPLAINTS PAGE (CSR #2) — pure Tailwind
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. CSR — "use client" page: list + filters render in the
      browser; data arrives via useEffect + Axios after mount.
   2. React Hooks — useState for list/filter/search state,
      useEffect for the initial load.
   3. Axios only — GET /admin/complaint/allcomplaints and
      GET /admin/complaint/search?keyword=... (JWT cookie).
   4. Dynamic routing — each row links to /admin/complaints/[id].
   ============================================================ */

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { authHeader } from "@/lib/getToken";
import {
  AdminPageHeader,
  AdminAlert,
  AdminBadge,
  btnPrimary,
  btnSecondary,
  inputClass,
  thClass,
  tdClass,
} from "@/lib/adminUi";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Complaint = {
  id: number;
  title: string;
  description: string;
  status: string;
  type?: string | null;
  filed_by_id?: number | null;
  reviewed_by?: { id: number; name: string } | null;
  created_at: string;
};

const STATUS_OPTIONS = ["All", "Pending", "In Progress", "Resolved", "Rejected"];
const FILER_OPTIONS = ["All", "Admin", "Landlord", "Staff", "Tenant"];

export default function ComplaintsPage() {
  /* ---------- state (hooks) ---------- */
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filerFilter, setFilerFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Complaint[] | null>(null);
  const [searching, setSearching] = useState(false);

  /* ---------- initial load (useEffect + Axios) ---------- */
  const loadComplaints = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await axios.get<Complaint[]>(`${API}/admin/complaint/allcomplaints`, {
        headers: authHeader(),
      });
      setComplaints(response.data);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  /* ---------- backend keyword search (Axios query param) ---------- */
  const runSearch = async () => {
    if (!keyword.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const response = await axios.get<Complaint[]>(`${API}/admin/complaint/search`, {
        headers: authHeader(),
        params: { keyword: keyword.trim() }, // ?keyword=...
      });
      setSearchResults(response.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  /* ---------- client-side filtering (CSR instant filters) ---------- */
  const source = searchResults ?? complaints;
  const visible = source.filter((c) => {
    const statusOk = statusFilter === "ALL" || c.status === statusFilter;
    const filerOk =
      filerFilter === "ALL" ||
      (c.filed_by_id !== null && filerFilter === "ADMIN") ||
      (c.filed_by_id !== null && filerFilter !== "ADMIN");
    return statusOk && filerOk;
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Complaint Center"
        subtitle="Inspect complaints from every role and record your review."
      />

      {loadFailed && (
        <AdminAlert kind="warning">
          Cannot reach the backend.
          <button type="button" onClick={loadComplaints} className={`${btnSecondary} ml-3`}>
            Retry
          </button>
        </AdminAlert>
      )}

      {/* Filter + search bar (pure Tailwind controls) */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <select
          className={`${inputClass} w-auto`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <select
          className={`${inputClass} w-auto`}
          value={filerFilter}
          onChange={(e) => setFilerFilter(e.target.value)}
        >
          {FILER_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f === "ALL" ? "All filers" : f.charAt(0) + f.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        <div className="flex min-w-56 flex-1 gap-2">
          <input
            className={inputClass}
            placeholder="Search complaints by keyword…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <button type="button" onClick={runSearch} className={btnPrimary}>
            {searching ? "…" : "Search"}
          </button>
          {searchResults !== null && (
            <button
              type="button"
              onClick={() => {
                setSearchResults(null);
                setKeyword("");
              }}
              className={btnSecondary}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && visible.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            {searchResults !== null
              ? "No complaints match your search."
              : "No complaints filed — everything is calm."}
          </p>
        </div>
      )}

      {/* Complaints table */}
      {!loading && visible.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Filed</th>
                <th className={thClass}>Reviewed By</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((complaint) => (
                <tr key={complaint.id} className="transition hover:bg-gray-50">
                  <td className={`${tdClass} font-mono text-xs`}>#{complaint.id}</td>
                  <td className={`${tdClass} max-w-xs`}>
                    <p className="truncate font-semibold text-gray-900">{complaint.title}</p>
                    <p className="truncate text-xs text-gray-500">{complaint.description}</p>
                  </td>
                  <td className={tdClass}>
                    <AdminBadge status={complaint.status} />
                  </td>
                  <td className={tdClass}>{new Date(complaint.created_at).toLocaleDateString()}</td>
                  <td className={tdClass}>{complaint.reviewed_by?.name ?? "—"}</td>
                  <td className={tdClass}>
                    {/* Dynamic route link → /admin/complaints/[id] */}
                    <Link
                      href={`/admin/complaints/${complaint.id}`}
                      className="text-xs font-semibold text-dwellix-600 hover:underline"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
