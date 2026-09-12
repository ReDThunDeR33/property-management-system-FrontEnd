import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LogoutButton from "./LogoutButton";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="relative">
        <Header />

        <div className="absolute top-1/2 right-6 -translate-y-1/2">
          <LogoutButton />
        </div>
      </div>

      <main className="flex-1 p-6">{children}</main>

      <Footer />
    </div>
  );
}