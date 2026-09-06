import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

export const dynamic = "force-dynamic";

const issueSchema = z.object({
  id: z.number(),
  description: z.string(),
  image_url: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  tenant_id: z.number(),
  property_id: z.number(),
});

const issueListSchema = z.array(issueSchema);
type Issue = z.infer<typeof issueSchema>;

const statusStyle: Record<string, string> = {
  OPEN: "bg-yellow-50 text-yellow-600",
};

export default async function IssuesPage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user")?.value;

  if (!userCookie) {
    redirect("/login");
  }

  let landlordId: number | null = null;
  try {
    landlordId = JSON.parse(decodeURIComponent(userCookie))?.id ?? null;
  } catch (err) {
    console.error("Error parsing user cookie:", err);
  }

  if (!landlordId) {
    return (
      <Layout>
        <p className="text-red-500">Could not find landlord id.</p>
      </Layout>
    );
  }

  let errorMessage = "";
  let issues: Issue[] = [];

  try {
    const response = await api.get(`/landlord/issues/${landlordId}`);
    const result = issueListSchema.safeParse(response.data);

    if (!result.success) {
      errorMessage = "Issue data came back in an unexpected shape.";
    } else {
      issues = result.data;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const backendMessage = error.response?.data?.message;
      if (Array.isArray(backendMessage)) {
        errorMessage = backendMessage[0];
      } else if (typeof backendMessage === "string") {
        errorMessage = backendMessage;
      } else if (!error.response) {
        errorMessage = "Cannot connect to the backend";
      } else {
        errorMessage = "Could not load issues";
      }
    } else {
      errorMessage = "Something went wrong";
    }
  }

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• ISSUE TRACKING</p>
          <h1 className="text-3xl font-semibold">Reported Issues</h1>
          <p className="text-gray-500 mt-2">
            Tenants report issues, issues are linked to property and can generate work order.
          </p>
        </div>

        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {!errorMessage && issues.length === 0 && <p className="text-gray-500">No issues reported.</p>}

        {!errorMessage && issues.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <div key={issue.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {issue.image_url && (
                  <div className="w-full h-40 bg-gray-100">
                    <img src={issue.image_url} alt="Issue photo" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Issue #{issue.id}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        statusStyle[issue.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{issue.description}</p>
                  <p className="text-gray-500 text-sm mt-3">
                    Reported by tenant #{issue.tenant_id} on{" "}
                    <Link href={`/landlord/Properties/${issue.property_id}`} className="text-[#FF5A3D]">
                      property #{issue.property_id}
                    </Link>
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}