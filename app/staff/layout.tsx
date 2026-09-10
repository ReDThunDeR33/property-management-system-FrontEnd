import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">{children}</main>
      <Footer />
    </div>
  );
}
