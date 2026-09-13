"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../Components/Layout";
import api from "../../../../lib/axios";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() || ""
    );
  }

  return null;
}

export default function ResolveIssueButton({
  issueId,
  status,
}: {
  issueId: number;
  status: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleResolve = async () => {
    setLoading(true);
    setErrorMessage("");

    const userData = getCookie("user");

    if (!userData) {
      setErrorMessage("You are not logged in.");
      setLoading(false);
      return;
    }

    let tenantId: number | null = null;

    try {
      tenantId = JSON.parse(userData)?.id ?? null;
    } catch (err) {
      console.error("Error parsing user cookie:", err);
    }

    if (!tenantId) {
      setErrorMessage("Could not find tenant id.");
      setLoading(false);
      return;
    }

    try {
      await api.patch(
        `/tenant/${tenantId}/issues/${issueId}/resolve`
      );

      router.refresh();
    } catch (error) {
      console.error("Resolve issue error:", error);
      setErrorMessage("Could not resolve issue.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "RESOLVED") {
    return (
      <div className="mt-6">
        <p className="text-green-600 font-medium">
          Issue Resolved
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {errorMessage && (
        <p className="text-red-500 mb-3">
          {errorMessage}
        </p>
      )}

      <button
        onClick={handleResolve}
        disabled={loading}
        className="bg-[#FF5A3D] text-white px-5 py-2.5 rounded-lg hover:bg-[#e94e34] transition disabled:opacity-60"
      >
        {loading
          ? "Updating..."
          : "Mark as Resolved"}
      </button>
    </div>
  );
}