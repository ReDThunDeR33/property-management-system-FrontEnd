"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";

type NotificationData = {
  workOrderId: number;
  workerName: string;
  message: string;
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() || "",
    );
  }

  return null;
}

export default function TenantNotifications() {

  const [notification, setNotification] =
    useState<NotificationData | null>(null);

  useEffect(function () {

    const accountType = getCookie("account_type");
    const userCookie = getCookie("user");
    const accessToken = getCookie("access_token");

    if (
      accountType !== "tenant" ||
      !userCookie ||
      !accessToken
    ) {
      return;
    }

    let user;

    try {
      user = JSON.parse(userCookie);
    } catch (error) {
      console.error("Could not read user cookie");
      return;
    }

    if (!user.id) {
      return;
    }

    const pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster:
          process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,

        channelAuthorization: {
          endpoint:
            `${process.env.NEXT_PUBLIC_API_URL}/pusher/auth`,

          transport: "ajax",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );

    const channelName =
      `private-tenant-${user.id}`;

    const channel =
      pusher.subscribe(channelName);

    channel.bind(
      "work-order-assigned",
      function (data: NotificationData) {

        console.log(
          "Notification received:",
          data,
        );

        setNotification(data);

        setTimeout(function () {
          setNotification(null);
        }, 5000);
      },
    );

    return function () {
      channel.unbind("work-order-assigned");
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };

  }, []);

  if (!notification) {
    return null;
  }

  return (
    <div className="fixed top-5 right-5 z-[100] w-96 rounded-xl bg-white border border-gray-200 shadow-lg p-5">

      <div className="flex items-start gap-3">

        <div className="text-2xl">
          🔔
        </div>

        <div>
          <p className="font-semibold">
            Work Order Assigned
          </p>

          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
        </div>

      </div>

    </div>
  );
}