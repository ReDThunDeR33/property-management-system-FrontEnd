"use client";

/* ============================================================
   PUSHER CLIENT (browser side of the real-time feature)
   ------------------------------------------------------------
   PusherJS (pusher-js npm package) connects the browser to the
   Pusher service over WebSockets. The PUBLIC key + cluster are
   safe to expose to the browser (the app secret stays on the
   server). Credentials are read from NEXT_PUBLIC_ env vars so
   the app works normally (without real-time) when they are
   not configured.
   ============================================================ */

import PusherClient from "pusher-js";

// Singleton across the whole app (one WebSocket connection).
let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  // Only ever run in the browser (client components).
  if (typeof window === "undefined") return null;

  if (pusherInstance) return pusherInstance;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "ap1";

  if (!key) {
    // No public key configured -> real-time notifications stay off.
    console.warn("Pusher public key missing - real-time notifications disabled");
    return null;
  }

  pusherInstance = new PusherClient(key, { cluster });
  return pusherInstance;
}

// Shared channel/event names (must match the backend PusherService).
export const ANNOUNCEMENT_CHANNEL = "announcements";
export const NEW_ANNOUNCEMENT_EVENT = "new-announcement";
