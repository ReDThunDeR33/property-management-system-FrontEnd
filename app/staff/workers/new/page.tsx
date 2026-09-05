"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader, getClientUser } from "@/lib/getToken";

const createWorkerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  worker_area: z.string().min(1, "Area is required"),
  status: z.enum(["free", "busy"]),
});

export default function NewWorkerPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", worker_area: "", status: "free" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = createWorkerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Please check the form fields.");
      return;
    }

    setSubmitting(true);
    try {
      const user = getClientUser();
      const staffId = user?.id || 1;
      await api.post(`/staff/${staffId}/workers`, parsed.data, { headers: authHeader() });
      router.push("/staff/workers");
    } catch {
      setError("Failed to create worker");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add Worker</h2>
          <p className="text-sm text-gray-500 mt-1">Register a new worker on your team.</p>
        </div>
        <Link href="/staff/workers" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Workers
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-lg">
        {error && <div className="text-sm text-red-500">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
          <input value={form.worker_area} onChange={(e) => setForm({ ...form, worker_area: e.target.value })} placeholder="e.g. Plumbing" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="free">Free</option>
            <option value="busy">Busy</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Add Worker"}
        </button>
      </form>
    </div>
  );
}
