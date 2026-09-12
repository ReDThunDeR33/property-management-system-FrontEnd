import Link from "next/link";

export default function LandlordNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f6] text-center px-6">
      <p className="text-[#FF5A3D] text-sm mb-2">• 404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-gray-500 mt-2">
        This page doesn&apos;t exist or the resource you&apos;re looking for isn&apos;t here.
      </p>
      <Link href="/landlord/Dashboard" className="mt-6 text-[#FF5A3D] font-medium">
        Back to Dashboard
      </Link>
    </div>
  );
}