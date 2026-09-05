"use client";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  
  const titles: Record<string, string> = {
    "/staff": "System Overview",
    "/staff/work-orders": "Work Order Management",
    "/staff/issues": "Issue Triage Hub",
    "/staff/workers": "Worker Management",
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-10 flex-shrink-0 z-10">
      <h1 className="text-xl font-semibold text-gray-800">{titles[pathname] || "Portal"}</h1>
      <div className="flex items-center gap-6">
        <div className="relative group">
          <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-dwellix-500 focus:bg-white focus:ring-1 focus:ring-dwellix-500 w-72 transition-all group-hover:border-gray-300" />
          <svg className="w-4 h-4 text-gray-400 absolute left-4 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>
    </header>
  );
}