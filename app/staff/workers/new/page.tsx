"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { authHeader, getClientUser } from "@/lib/getToken";

export default function NewWorkerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const user = getClientUser();
    const staffId = user?.id || 1;
    await api.post(`/staff/${staffId}/workers`, { name, email, phone, worker_area: area }, { headers: authHeader() });
    router.push("/staff/workers");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Add Worker</h2>
        <Link href="/staff/workers" className="text-sm text-dwellix-500 hover:underline">
          &larr; Back to Workers
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
          <input value={area} onChange={(e) => setArea(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-white rounded-lg text-sm font-medium active:scale-95 transition-all duration-150 shadow-sm"
          style={{ backgroundColor: "#ff5a3d" }}
        >
          Add Worker
        </button>
      </form>
    </div>
  );
}
