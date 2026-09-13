"use client";

/* ============================================================
   ADMIN ANNOUNCEMENT TOAST — components/admin/AdminAnnouncementToast.tsx
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED IN THIS FILE:

   1. PUSHERJS REAL-TIME NOTIFICATIONS (bonus feature)
      This client component subscribes to the "announcements"
      Pusher channel. Whenever the admin publishes an
      announcement (server-side trigger in
      announcement.service.ts), every connected browser
      receives the event over the WebSocket instantly and a
      DaisyUI toast appears — no page refresh, no polling.
      Unsubscribes cleanly on unmount (useEffect cleanup).

   2. REACT HOOKS
      - useState  -> the list of live toast messages
      - useEffect -> subscribe on mount, unsubscribe on unmount
        (the [] dependency array = run once).

   3. DAISYUI — toast + alert + btn components.

   Place <AdminAnnouncementToast /> once inside any role's
   layout to enable real-time announcement popups there.
   ============================================================ */

import { useEffect, useState } from "react";
import {
  getPusherClient,
  ANNOUNCEMENT_CHANNEL,
  NEW_ANNOUNCEMENT_EVENT,
} from "@/lib/pusher";

type AnnouncementEvent = {
  id: number;
  title: string;
  body: string;
  created_by: string;
};

type ToastItem = AnnouncementEvent & { toastId: number };

export default function AdminAnnouncementToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /* useEffect: subscribe to the Pusher channel once on mount.
     The returned cleanup function unsubscribes when the
     component unmounts (React hooks lifecycle rule). */
  useEffect(() => {
    const pusher = getPusherClient();

    // Pusher not configured -> render nothing (feature disabled).
    if (!pusher) return;

    const channel = pusher.subscribe(ANNOUNCEMENT_CHANNEL);

    const handler = (data: unknown) => {
      const payload = data as AnnouncementEvent;

      // Unique id for this toast instance (used to dismiss it later).
      const toastId = Date.now();

      // Add a new toast.
      setToasts((previous) => [...previous, { ...payload, toastId }]);

      // Auto-dismiss this toast after 6 seconds.
      setTimeout(() => {
        setToasts((previous) =>
          previous.filter((toast) => toast.toastId !== toastId),
        );
      }, 6000);
    };

    channel.bind(NEW_ANNOUNCEMENT_EVENT, handler);

    // Cleanup: unbind + unsubscribe on unmount.
    return () => {
      channel.unbind(NEW_ANNOUNCEMENT_EVENT, handler);
      pusher.unsubscribe(ANNOUNCEMENT_CHANNEL);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-end z-[100]">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className="alert border-l-4 border-l-dwellix-500 bg-white shadow-lg"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              New announcement · {toast.created_by}
            </p>
            <p className="text-sm font-bold">{toast.title}</p>
            <p className="line-clamp-2 text-xs text-gray-500">{toast.body}</p>
          </div>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() =>
              setToasts((previous) =>
                previous.filter((item) => item.toastId !== toast.toastId),
              )
            }
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
