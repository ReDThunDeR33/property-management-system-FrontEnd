"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffSidebar from "@/components/StaffSidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const accountType = getCookie("account_type");
    const token = getCookie("access_token");

    if (!token || accountType !== "staff") {
      router.push("/login");
      return;
    }

    setChecked(true);
  }, [router]);

  if (!checked) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <StaffSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}