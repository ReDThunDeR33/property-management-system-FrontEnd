"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() || "",
    );
  }

  return null;
}

const profileSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
  })
  .passthrough();

type Profile = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userCookie = getCookie("user");

        if (!userCookie) {
          setError("User information not found.");
          return;
        }

        const user = JSON.parse(userCookie);
        const tenantId = user.id;

        const response = await api.get(
          `/tenant/profile/${tenantId}`,
        );

        const result = profileSchema.safeParse(response.data);

        if (!result.success) {
          setError("Invalid profile data.");
          return;
        }

        setProfile(result.data);
        setName(result.data.name || "");
        setPhone(result.data.phone || "");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Failed to load profile.",
          );
        } else {
          setError("Failed to load profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.patch(`/tenant/update/${profile.id}`, {
        name,
        phone,
      });

      setMessage("Profile updated successfully.");

      setProfile({
        ...profile,
        name,
        phone,
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to update profile.",
        );
      } else {
        setError("Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-[#FF5A3D]">
            Account
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            My Profile
          </h1>

          <p className="mt-2 text-gray-500">
            View and update your personal information.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6">
            Loading profile...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {profile && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#FF5A3D]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#FF5A3D]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#FF5A3D] px-6 py-3 font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}