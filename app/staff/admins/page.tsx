"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader } from "@/lib/getToken";

const adminSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
});

const adminsResponseSchema = z.array(adminSchema);

type Admin = z.infer<typeof adminSchema>;

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/staff/admins", { headers: authHeader() });
        const parsed = adminsResponseSchema.safeParse(res.data);
        if (!parsed.success) {
          setError("Invalid data received from server");
          return;
        }
        setAdmins(parsed.data);
      } catch {
        setError("Failed to load admins");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admins</h2>
        <p className="text-sm text-gray-500 mt-1">{admins.length} admin accounts.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-6">Email</div>
        </div>

        {loading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-500">{error}</div>}
        {!loading && !error && admins.length === 0 && <div className="p-6 text-sm text-gray-500">No admins found.</div>}
        {!loading && !error && admins.map((a) => (
          <div key={a.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center text-sm">
            <div className="col-span-6 text-gray-900 font-medium">{a.name}</div>
            <div className="col-span-6 text-gray-700">{a.email || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
