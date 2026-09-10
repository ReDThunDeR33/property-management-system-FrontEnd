import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link href="/staff/dashboard" className="text-lg font-bold text-gray-900">
        Dwellix Staff
      </Link>
      <nav className="flex flex-wrap gap-4 text-sm text-gray-600">
        <Link href="/staff/dashboard" className="hover:text-dwellix-500">Dashboard</Link>
        <Link href="/staff/work-orders" className="hover:text-dwellix-500">Work Orders</Link>
        <Link href="/staff/workers" className="hover:text-dwellix-500">Workers</Link>
        <Link href="/staff/issues" className="hover:text-dwellix-500">Issues</Link>
        <Link href="/staff/properties" className="hover:text-dwellix-500">Properties</Link>
        <Link href="/staff/tenants" className="hover:text-dwellix-500">Tenants</Link>
        <Link href="/staff/landlords" className="hover:text-dwellix-500">Landlords</Link>
        <Link href="/staff/reports/worker-performance" className="hover:text-dwellix-500">Reports</Link>
        <Link href="/staff/profile" className="hover:text-dwellix-500">Profile</Link>
      </nav>
    </header>
  );
}
