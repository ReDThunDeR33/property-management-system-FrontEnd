import { cookies } from "next/headers";
import { z } from "zod";
import api from "@/lib/axios";

const dashboardStatsSchema = z.object({
  workOrders: z.object({
    total: z.number(),
    pending: z.number(),
    assigned: z.number(),
    inProgress: z.number(),
    completed: z.number(),
  }),
  workers: z.object({
    total: z.number(),
    free: z.number(),
    busy: z.number(),
  }),
  issues: z.object({
    open: z.number(),
    inProgress: z.number(),
  }),
  properties: z.object({
    total: z.number(),
    occupied: z.number(),
    vacant: z.number(),
  }),
  landlords: z.object({
    total: z.number(),
  }),
  tenants: z.object({
    total: z.number(),
  }),
  hierarchy: z.object({
    blocks: z.number(),
    buildings: z.number(),
  }),
  financials: z.object({
    monthlyWorkOrderRevenue: z.number(),
    monthlyRentCollected: z.number(),
  }),
});

type DashboardStats = z.infer<typeof dashboardStatsSchema>;

async function getDashboardStats(staffId: string | number, token?: string): Promise<DashboardStats> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await api.get(`/staff/dashboard/stats?staffId=${staffId}`, {
    headers,
  });

  const parsed = dashboardStatsSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new Error("Invalid dashboard stats structure received from backend");
  }

  return parsed.data;
}

export default async function StaffDashboard() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");
  const tokenCookie = cookieStore.get("access_token");

  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie.value));
    } catch (error) {
      console.error("Failed to parse user cookie", error);
    }
  }

  const staffId = user?.id || 1;
  const token = tokenCookie ? decodeURIComponent(tokenCookie.value) : undefined;
  
  const stats = await getDashboardStats(staffId, token);

  // Placeholder arrays to demonstrate where your future list data will map into the UI
  const recentIssues = [
    { id: 1, title: "Water Leak in Kitchen", location: "Cedar Valley Estate, Apt 4B", status: "Unassigned", icon: "⚠️", color: "red" },
    { id: 2, title: "Keycard Access Denied", location: "Ocean View Manor, Main Gate", status: "In Progress", icon: "🔑", color: "blue" }
  ];

  const activeDispatches = [
    { id: 1, initials: "JD", name: "John Doe", role: "Plumber", status: "On Site", color: "green" },
    { id: 2, initials: "SS", name: "Sarah Smith", role: "Electrician", status: "En Route", color: "yellow" }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Active Work Orders</div>
          <div className="text-3xl font-bold text-gray-900">{stats.workOrders.inProgress}</div>
          <div className="text-gray-400 text-xs mt-4">{stats.workOrders.pending} pending assignment</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Pending Issues</div>
          <div className="text-3xl font-bold text-gray-900">{stats.issues.open}</div>
          <div className="text-red-500 text-xs mt-4">{stats.issues.open > 0 ? "Requires triage" : "All clear"}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Available Workers</div>
          <div className="text-3xl font-bold text-gray-900">{stats.workers.free}</div>
          <div className="text-gray-400 text-xs mt-4">Out of {stats.workers.total} total</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Completed Work Orders</div>
          <div className="text-3xl font-bold text-gray-900">{stats.workOrders.completed}</div>
          <div className="text-green-500 text-xs mt-4">Successfully resolved</div>
        </div>
      </div>

      {/* Bottom Layout: 2/3 and 1/3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Section: Recent Issues */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Recent Issues to Triage</h3>
          </div>
          <div className="p-0">
            {recentIssues.map((issue, index) => (
              <div key={issue.id} className={`flex items-center justify-between p-6 ${index !== recentIssues.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 bg-${issue.color}-50 text-${issue.color}-500 rounded flex items-center justify-center`}>
                    {issue.icon}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{issue.title}</div>
                    <div className="text-sm text-gray-500">{issue.location}</div>
                  </div>
                </div>
                <div className={`bg-${issue.color}-100 text-${issue.color}-600 text-xs px-3 py-1 rounded-full`}>
                  {issue.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Active Dispatches */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Active Dispatches</h3>
          <div className="space-y-6 flex-grow">
            {activeDispatches.map((dispatch) => (
              <div key={dispatch.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                    {dispatch.initials}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{dispatch.name}</div>
                    <div className="text-xs text-gray-500">{dispatch.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span className={`w-2 h-2 rounded-full bg-${dispatch.color}-500 block`}></span>
                  {dispatch.status}
                </div>
              </div>
            ))}
          </div>

          <button className="mt-8 w-full py-3 border-2 border-dashed border-gray-300 rounded text-gray-500 text-sm">
            + Dispatch Worker
          </button>
        </div>
      </div>
    </div>
  );
}