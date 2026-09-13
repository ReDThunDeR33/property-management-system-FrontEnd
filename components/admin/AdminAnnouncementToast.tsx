"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher";

type Toast = {
  id: string;
  title: string;
  body: string;
};

export default function AdminAnnouncementToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("announcements");

    channel.bind(
      "new-announcement",
      (data: { id: number; title: string; body: string; created_by: string }) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [
          ...prev,
          { id, title: data.title, body: `${data.body} — by ${data.created_by}` },
        ]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 6000);
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("announcements");
    };
  }, []);

  return (
    <div className="fixed right-5 bottom-5 z-[80] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="min-w-[260px] max-w-[360px] rounded-xl bg-dwellix-500 px-4 py-3 text-sm text-white shadow-lg"
        >
          <p className="font-semibold">{toast.title}</p>
          <p className="mt-1 text-xs opacity-90">{toast.body}</p>
        </div>
      ))}
    </div>
  );
}