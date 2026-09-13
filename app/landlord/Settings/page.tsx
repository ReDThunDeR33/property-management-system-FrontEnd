"use client";

import { useEffect, useState, FormEvent } from "react";
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

const profileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  status: z.string(),
  created_at: z.string(),
});

type Profile = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const [landlordId, setLandlordId] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentName, setCurrentName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData = getCookie("user");
      if (!userData) {
        setErrorMessage("You are not logged in.");
        setLoading(false);
        return;
      }

      let id: number | null = null;
      try {
        id = JSON.parse(userData)?.id ?? null;
      } catch (err) {
        console.error("Error parsing user cookie:", err);
      }

      if (!id) {
        setErrorMessage("Could not find landlord id.");
        setLoading(false);
        return;
      }
      setLandlordId(id);

      try {
        const response = await api.get(`/landlord/profile/${id}`);
        const result = profileSchema.safeParse(response.data);

        if (!result.success) {
          setErrorMessage("Profile data came back in an unexpected shape.");
          setLoading(false);
          return;
        }

        setProfile(result.data);
        setName(result.data.name);
        setEmail(result.data.email);
        setPhone(result.data.phone);
        setCurrentName(result.data.name);
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
            setErrorMessage("Could not load profile");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const profileFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(1, "Phone is required"),
  });

  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const result = profileFormSchema.safeParse({ name, email, phone });
    if (!result.success) {
      setProfileError(result.error.issues[0].message);
      return;
    }
    if (!landlordId) return;

    try {
      setSavingProfile(true);
      const response = await api.put(`/landlord/update/${landlordId}`, result.data);
      setProfile(response.data);
      setCurrentName(response.data.name);

      // keep the "user" cookie in sync so the header/sidebar reflect the change immediately
      const userData = getCookie("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const updatedUser = {
          ...parsedUser,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
        };
        document.cookie = `user=${encodeURIComponent(JSON.stringify(updatedUser))}; path=/; max-age=604800; SameSite=Lax`;
      }

      setProfileSuccess("Profile updated.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (Array.isArray(backendMessage)) {
          setProfileError(backendMessage[0]);
        } else if (typeof backendMessage === "string") {
          setProfileError(backendMessage);
        } else if (!error.response) {
          setProfileError("Cannot connect to the backend");
        } else {
          setProfileError("Could not update profile");
        }
      } else {
        setProfileError("Something went wrong");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const passwordFormSchema = z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
      confirmPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const handleUpdatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const result = passwordFormSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
      return;
    }
    if (!landlordId) return;

    try {
      setSavingPassword(true);
      await api.patch(`/landlord/update_password/${landlordId}`, {
        name: currentName,
        password_hash: result.data.currentPassword,
        newpassword: result.data.newPassword,
      });

      setPasswordSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (Array.isArray(backendMessage)) {
          setPasswordError(backendMessage[0]);
        } else if (typeof backendMessage === "string") {
          setPasswordError(backendMessage);
        } else if (!error.response) {
          setPasswordError("Cannot connect to the backend");
        } else {
          setPasswordError("Could not update password");
        }
      } else {
        setPasswordError("Something went wrong");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• ACCOUNT SETTINGS</p>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-gray-500 mt-2">Manage your profile and password.</p>
        </div>

        {loading && <p className="text-gray-500">Loading profile...</p>}
        {!loading && errorMessage && <p className="text-red-500">{errorMessage}</p>}

        {!loading && !errorMessage && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleUpdateProfile} className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Profile</h2>

              {profileError && <p className="text-red-500 mb-3">{profileError}</p>}
              {profileSuccess && <p className="text-green-600 mb-3">{profileSuccess}</p>}

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="mt-4 bg-[#FF5A3D] text-white px-5 py-2 rounded-lg text-sm"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>

            <form onSubmit={handleUpdatePassword} className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Change Password</h2>

              {passwordError && <p className="text-red-500 mb-3">{passwordError}</p>}
              {passwordSuccess && <p className="text-green-600 mb-3">{passwordSuccess}</p>}

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="mt-4 bg-[#FF5A3D] text-white px-5 py-2 rounded-lg text-sm"
              >
                {savingPassword ? "Saving..." : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </section>
    </Layout>
  );
}