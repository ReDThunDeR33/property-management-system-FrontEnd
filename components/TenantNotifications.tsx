"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher";

type Toast = {
  id: string;
  message: string;
};

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

export default function TenantNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const accountType = getCookie("account_type");
    const userData = getCookie("user");
    if (accountType !== "tenant" || !userData) return;

    let tenantId: number | null = null;
    try {
      tenantId = JSON.parse(userData)?.id ?? null;
    } catch {
      return;
    }
    if (!tenantId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`tenant-${tenantId}`);

    channel.bind(
      "tenant-status-changed",
      (data: { status: "APPROVED" | "REJECTED"; propertyUnit?: string | null }) => {
        const id = crypto.randomUUID();
        const message =
          data.status === "APPROVED"
            ? `Your tenancy was approved${data.propertyUnit ? ` for unit ${data.propertyUnit}` : ""}.`
            : "Your tenancy application was rejected.";
        setToasts((prev) => [...prev, { id, message }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 6000);
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`tenant-${tenantId}`);
    };
  }, []);

  return (
    <div className="fixed right-5 bottom-5 z-[80] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="min-w-[240px] max-w-[340px] rounded-xl bg-green-600 px-4 py-3 text-sm text-white shadow-lg"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}