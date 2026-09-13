"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher";

type Toast = { id: string; title: string; body: string;};


export default function AdminAnnouncementToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("announcements");

    const onNewAnnouncement = (data: { title?: string; body?: string }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = {
        id,
        title: data?.title ?? "New announcement",
        body: data?.body ?? "",
      };
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    };

    channel.bind("new-announcement", onNewAnnouncement);

    return () => {
      channel.unbind("new-announcement", onNewAnnouncement);
      pusher.unsubscribe("announcements");
    };
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-20 z-[100] flex w-96 flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-xl border border-gray-200 bg-white p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-dwellix-500 text-white">
              ✦
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">{toast.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-600">{toast.body}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="grid h-6 w-6 place-items-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
