"use client";

export default function Dashboard() {


  return (
    <>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Landlord Dashboard | Dwellix</title>
  <style
    dangerouslySetInnerHTML={{
      __html:
        "\n    body{margin:0;background:#f7f7f6;color:#202124}\n    .nav-item:hover{background:#fff0ed;color:#FF5A3D}\n    .nav-item.active{background:#fff0ed;color:#FF5A3D;font-weight:600}\n  "
    }}
  />
  <div className="min-h-screen flex flex-col">
    <header className="h-20 bg-white border-b flex items-center justify-between px-6 lg:px-10">
      <h1 className="text-xl font-bold">Dwellix</h1>
      <div className="text-sm text-gray-500">John Anderson (Landlord)</div>
    </header>
    <div className="flex flex-1">
      <aside className="w-64 bg-white border-r p-5 space-y-1">
        <a
          href="dashboard.html"
          className="nav-item active block px-4 py-3 rounded-xl"
        >
          ▦ Dashboard
        </a>
        <a
          href="properties.html"
          className="nav-item block px-4 py-3 rounded-xl"
        >
          ⌂ My Properties
        </a>
        <a href="tenants.html" className="nav-item block px-4 py-3 rounded-xl">
          👥 Tenants
        </a>
        <a href="issues.html" className="nav-item block px-4 py-3 rounded-xl">
          ⚠ Issues
        </a>
        <a
          href="workorders.html"
          className="nav-item block px-4 py-3 rounded-xl"
        >
          🔧 Work Orders
        </a>
        <a href="workers.html" className="nav-item block px-4 py-3 rounded-xl">
          🧰 Workers
        </a>
        <a
          href="transactions.html"
          className="nav-item block px-4 py-3 rounded-xl"
        >
          ◫ Transactions
        </a>
        <a href="reviews.html" className="nav-item block px-4 py-3 rounded-xl">
          ★ Reviews
        </a>
        <a href="settings.html" className="nav-item block px-4 py-3 rounded-xl">
          ⚙ Settings
        </a>
      </aside>
      <main className="flex-1 p-6 lg:p-10">
        <h2 className="text-3xl font-semibold mb-6">Welcome back, John.</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-2xl p-5">
            Total Properties: <b>12</b>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            Active Tenants: <b>28</b>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            Open Issues: <b>5</b>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            Open Work Orders: <b>3</b>
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-3">Recent Activity</h3>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Tenant application submitted - Bluewater Haven</li>
            <li>Work order completed - Cedar Valley Estate</li>
            <li>Rent payment recorded - Emerald Residence</li>
          </ul>
        </div>
      </main>
    </div>
  </div>
</>

  );
}