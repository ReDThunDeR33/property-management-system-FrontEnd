"use client";

import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/axios";
import { authHeader, getClientUser, setClientUser } from "@/lib/getToken";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = getClientUser();
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Only include a field if it's not empty, so blank fields don't overwrite existing data.
    const body = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(password && { password }),
    };
    const res = await api.patch("/staff/profile", body, { headers: authHeader() });
    setClientUser({ ...getClientUser(), ...res.data });
    setMessage("Profile updated.");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>

      {message && <p className="text-sm text-green-600">{message}</p>}

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
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#ff5a3d] text-white rounded-lg text-sm font-medium
             hover:bg-[#e64a32] active:scale-95 transition-all duration-150 shadow-sm"        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
