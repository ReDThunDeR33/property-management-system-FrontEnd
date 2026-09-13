
"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";

type Toast = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() || ""
    );
  }

  return null;
}

export default function PusherNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(
    type: Toast["type"],
    message: string
  ) {
    const id = crypto.randomUUID();

    setToasts((previous) => [
      ...previous,
      {
        id,
        type,
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((previous) =>
        previous.filter((toast) => toast.id !== id)
      );
    }, 5000);
  }

  useEffect(() => {
    console.log("========== PUSHER START ==========");

    // -------------------------------------------------
    // 1. Get user cookie
    // -------------------------------------------------

    const userData = getCookie("user");

    console.log("Pusher user cookie:", userData);

    if (!userData) {
      console.error(
        "PUSHER ERROR: user cookie not found"
      );
      return;
    }

    let landlordId: number | null = null;

    try {
      const parsedUser = JSON.parse(userData);

      console.log(
        "Pusher parsed user:",
        parsedUser
      );

      landlordId = Number(parsedUser?.id);

    } catch (error) {
      console.error(
        "PUSHER ERROR: Could not parse user cookie",
        error
      );

      return;
    }

    console.log(
      "Pusher landlord ID:",
      landlordId
    );

    if (!landlordId || Number.isNaN(landlordId)) {
      console.error(
        "PUSHER ERROR: Invalid landlord ID"
      );

      return;
    }

    // -------------------------------------------------
    // 2. Get environment variables
    // -------------------------------------------------

    const key =
      process.env.NEXT_PUBLIC_PUSHER_KEY;

    const cluster =
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    console.log(
      "Pusher key exists:",
      !!key
    );

    console.log(
      "Pusher cluster:",
      cluster
    );

    if (!key) {
      console.error(
        "PUSHER ERROR: NEXT_PUBLIC_PUSHER_KEY is missing"
      );

      return;
    }

    if (!cluster) {
      console.error(
        "PUSHER ERROR: NEXT_PUBLIC_PUSHER_CLUSTER is missing"
      );

      return;
    }

    // -------------------------------------------------
    // 3. Create Pusher client
    // -------------------------------------------------

    console.log(
      "Creating Pusher client..."
    );

    const pusher = new Pusher(key, {
      cluster: cluster,
    });

    // -------------------------------------------------
    // 4. Monitor connection
    // -------------------------------------------------

    pusher.connection.bind(
      "state_change",
      (states: {
        previous: string;
        current: string;
      }) => {
        console.log(
          "Pusher connection:",
          states.previous,
          "→",
          states.current
        );
      }
    );

    pusher.connection.bind(
      "connected",
      () => {
        console.log(
          "PUSHER CONNECTED SUCCESSFULLY"
        );

        console.log(
          "Socket ID:",
          pusher.connection.socket_id
        );
      }
    );

    pusher.connection.bind(
      "error",
      (error: unknown) => {
        console.error(
          "PUSHER CONNECTION ERROR:",
          error
        );
      }
    );

    // -------------------------------------------------
    // 5. Subscribe to landlord channel
    // -------------------------------------------------

    const channelName =
      `landlord-${landlordId}`;

    console.log(
      "Subscribing to:",
      channelName
    );

    const channel =
      pusher.subscribe(channelName);

    // -------------------------------------------------
    // 6. Check subscription
    // -------------------------------------------------

    channel.bind(
      "pusher:subscription_succeeded",
      () => {
        console.log(
          "PUSHER SUBSCRIPTION SUCCESS:",
          channelName
        );

        showToast(
          "info",
          `Real-time notifications connected for landlord ${landlordId}`
        );
      }
    );

    channel.bind(
      "pusher:subscription_error",
      (error: unknown) => {
        console.error(
          "PUSHER SUBSCRIPTION ERROR:",
          error
        );
      }
    );

    // -------------------------------------------------
    // 7. Listen for new issue
    // -------------------------------------------------

    channel.bind(
      "new-issue",
      (data: {
        issueId: number;
        propertyId: number;
        unitNumber: string;
        description: string;
      }) => {
        console.log(
          "PUSHER EVENT: new-issue",
          data
        );

        showToast(
          "error",
          `New issue on ${data.unitNumber}: ${data.description}`
        );
      }
    );

    // -------------------------------------------------
    // 8. Listen for work order created
    // -------------------------------------------------

    channel.bind(
      "work-order-created",
      (data: {
        workOrderId: number;
        propertyId: number;
        unitNumber: string;
      }) => {
        console.log(
          "PUSHER EVENT: work-order-created",
          data
        );

        showToast(
          "info",
          `Work order #${data.workOrderId} opened for ${data.unitNumber}`
        );
      }
    );

    // -------------------------------------------------
    // 9. Listen for work order completed
    // -------------------------------------------------

    channel.bind(
      "work-order-complete",
      (data: {
        workOrderId: number;
        propertyId: number;
        unitNumber: string;
        totalCost: number;
      }) => {
        console.log(
          "PUSHER EVENT: work-order-complete",
          data
        );

        showToast(
          "success",
          `Work order #${data.workOrderId} completed for ${data.unitNumber}. Cost: $${data.totalCost}`
        );
      }
    );

    // -------------------------------------------------
    // 10. Listen for transaction paid
    // -------------------------------------------------

    channel.bind(
      "transaction-paid",
      (data: {
        transactionId: number;
        propertyId: number;
        unitNumber: string;
        amount: number;
        type: string;
      }) => {
        console.log(
          "PUSHER EVENT: transaction-paid",
          data
        );

        showToast(
          "success",
          `Payment received: $${data.amount} (${data.type}) for ${data.unitNumber}`
        );
      }
    );

    // -------------------------------------------------
    // 11. Listen to ALL events
    // Useful for debugging
    // -------------------------------------------------

    channel.bind_global(
      (eventName: string, data: unknown) => {
        console.log(
          "PUSHER GLOBAL EVENT:",
          eventName,
          data
        );
      }
    );

    // -------------------------------------------------
    // 12. Cleanup
    // -------------------------------------------------

    return () => {
      console.log(
        "Cleaning up Pusher:",
        channelName
      );

      channel.unbind_all();

      pusher.unsubscribe(channelName);

      pusher.disconnect();
    };

  }, []);

  return (
    <div className="fixed right-5 bottom-24 z-[9999] flex flex-col gap-3">

      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            min-w-[280px]
            max-w-[380px]
            px-5
            py-4
            rounded-xl
            text-white
            text-sm
            shadow-2xl
            border
            border-white/20
            ${
              toast.type === "error"
                ? "bg-red-600"
                : toast.type === "info"
                ? "bg-blue-600"
                : "bg-green-600"
            }
          `}
        >
          {toast.message}
        </div>
      ))}

    </div>
  );
}

