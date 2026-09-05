"use client";

import { FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import api from "@/lib/axios";
import { authHeader, getClientUser, setClientUser } from "@/lib/getToken";

const profileSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  })
  .refine((data) => Object.values(data).some((v) => v && v.length > 0), {
    message: "At least one field is required",
  });

export default function ProfilePage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getClientUser();
    if (user) {
      setForm((f) => ({ ...f, name: user.name || "", email: user.email || "" }));
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Please check the form fields.");
      return;
    }

    const payload: Record<string, string> = {};
    if (form.name) payload.name = form.name;
    if (form.email) payload.email = form.email;
    if (form.phone) payload.phone = form.phone;
    if (form.password) payload.password = form.password;

    setSubmitting(true);
    try {
      const res = await api.patch("/staff/profile", payload, { headers: authHeader() });
      const existing = getClientUser();
      setClientUser({ ...existing, ...res.data });
      setSuccess("Profile updated successfully.");
      setForm((f) => ({ ...f, password: "" }));
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Update your account details. Leave a field blank to keep it unchanged.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-lg">
        {error && <div className="text-sm text-red-500">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

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
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-dwellix-500 text-white rounded-lg text-sm font-medium hover:bg-dwellix-600 transition-colors shadow-sm disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
