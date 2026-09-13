"use client";

import { useState } from "react";
import axios from "axios";
import api from "../../../../lib/axios";

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

export default function ResolveIssueButton({
  issueId,
  onResolved,
}: {
  issueId: number;
  onResolved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResolve = async () => {
    try {
      setLoading(true);
      setError("");

      const userCookie = getCookie("user");

      if (!userCookie) {
        setError("User information not found.");
        return;
      }

      const user = JSON.parse(userCookie);
      const tenantId = user.id;

      await api.patch(
        `/tenant/${tenantId}/issues/${issueId}/resolve`,
      );

      onResolved();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Could not resolve issue.",
        );
      } else {
        setError("Could not resolve issue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleResolve}
        disabled={loading}
        className="rounded-lg bg-[#FF5A3D] px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Resolving..." : "Mark as Resolved"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}