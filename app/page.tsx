"use client";

export default function Dashboard() {


  return (
    <section>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <p className="text-[#FF5A3D] text-sm font-medium mb-2">• LANDLORD DASHBOARD</p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Welcome back, John.</h1>
          <p className="text-gray-500 mt-2">Overview of properties, tenants, issues, maintenance, and transactions.</p>
        </div>
        <button onClick={() => goTo("properties")} className="bg-[#FF5A3D] text-white px-6 py-3 rounded-xl font-medium">
          + Add New Property
        </button>
      </div>
      {/* Copy remaining dashboard blocks exactly from your HTML, replacing class->className and onclick->onClick */}
    </section>

  );
}