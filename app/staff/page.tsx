import { cookies } from "next/headers";
import { z } from "zod";
import Link from "next/link";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

function verifyUserCookie(user: any) {
  if (!user) throw new Error("Invalid user cookie");

  if (user.account_type !== "staff") {
    const router = useRouter();
    router.push("/login");
  }
}

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

const issueSchema = z.object({
  id: z.number(),
  description: z.string().nullable(),
  status: z.string(),
  property: z.object({ unit_number: z.string() }).nullable(),
});
type Issue = z.infer<typeof issueSchema>;

const workerSchema = z.object({
  id: z.number(),
  name: z.string(),
  worker_area: z.string().nullable(),
});
type Worker = z.infer<typeof workerSchema>;

async function getDashboardStats(staffId: string | number, token?: string): Promise<DashboardStats> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await api.get(`/staff/dashboard/stats?staffId=${staffId}`, { headers });
  const parsed = dashboardStatsSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new Error("Invalid dashboard stats structure received from backend");
  }

  return parsed.data;
}

async function getRecentIssues(token?: string): Promise<Issue[]> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let response;

  try {
    response = await api.get("/staff/issues?limit=5", { headers });
  }
  catch (error) {
    console.error("Error fetching recent issues:", error);
    return [];
  }
  const parsed = z.object({ data: z.array(issueSchema) }).safeParse(response.data);

  if (!parsed.success) return [];
  return parsed.data.data.filter((issue) => issue.status !== "RESOLVED").slice(0, 3);
}

async function getBusyWorkers(token?: string): Promise<Worker[]> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  let response;
  try {
    response = await api.get("/staff/workers?status=busy&limit=5", { headers });
  } catch (error) {
    console.error("Error fetching busy workers:", error);
    return [];
  }
  const parsed = z.object({ data: z.array(workerSchema) }).safeParse(response.data);

  if (!parsed.success) return [];
  return parsed.data.data;
}

export default async function StaffDashboard() {

  const cookieStore = await cookies();

  const rawCookie = cookieStore.get("user")?.value;
  const userParsed = rawCookie ? JSON.parse(decodeURIComponent(rawCookie)) : null;
  verifyUserCookie(userParsed);
  
  const userCookie = cookieStore.get("user");
  const tokenCookie = cookieStore.get("access_token");
  const accountType = cookieStore.get("account_type")?.value;


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
  const recentIssues = await getRecentIssues(token);
  const busyWorkers = await getBusyWorkers(token);

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

        {/* Left Section: Recent Issues (real data) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Issues to Triage</h3>
            <Link href="/staff/issues" className="text-sm text-dwellix-500">View all</Link>
          </div>
          <div>
            {recentIssues.length === 0 && (
              <div className="p-6 text-sm text-gray-500">No open issues right now.</div>
            )}
            {recentIssues.map((issue, index) => (
              <div
                key={issue.id}
                className={`flex items-center justify-between p-6 ${index !== recentIssues.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div>
                  <div className="font-bold text-gray-900">{issue.description || "No description"}</div>
                  <div className="text-sm text-gray-500">{issue.property ? issue.property.unit_number : "-"}</div>
                </div>
                <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{issue.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Busy Workers (real data) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Busy Workers</h3>
            <Link href="/staff/workers" className="text-sm text-dwellix-500">View all</Link>
          </div>
          <div className="space-y-6 flex-grow">
            {busyWorkers.length === 0 && (
              <div className="text-sm text-gray-500">No workers busy right now.</div>
            )}
            {busyWorkers.map((worker) => (
              <div key={worker.id} className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{worker.name}</div>
                  <div className="text-xs text-gray-500">{worker.worker_area || "-"}</div>
                </div>
                <span className="text-xs text-yellow-600">busy</span>
              </div>
            ))}
          </div>

          <Link
            href="/staff/work-orders"
            className="mt-8 w-full text-center py-3 border-2 border-dashed border-gray-300 rounded text-gray-500 text-sm"
          >
            + Dispatch Worker
          </Link>
        </div>
      </div>
    </div>
  );
}
