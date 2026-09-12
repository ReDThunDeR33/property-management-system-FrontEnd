import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../../Components/Layout";
import api from "../../../../lib/axios";

export const dynamic = "force-dynamic";

const workOrderSchema = z.object({
  id: z.number(),
  created_by_type: z.string(),
  created_by_id: z.number(),
  status: z.string(),
  labor_cost: z.union([z.string(), z.number(), z.null()]),
  materials_cost: z.union([z.string(), z.number(), z.null()]),
  additional_cost: z.union([z.string(), z.number(), z.null()]),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});

const workOrderListSchema = z.array(workOrderSchema);
type WorkOrder = z.infer<typeof workOrderSchema>;

type Props = {
  params: Promise<{ workorders: string }>;
};

export default async function WorkOrderDetailPage({ params }: Props) {
  const { workorders } = await params;
  const workOrderId = Number(workorders);

  if (!workOrderId) {
    notFound();
  }

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
  let order: WorkOrder | null = null;
  let orderMissing = false;

  try {
    // No GET /landlord/workorder/:landlordId/:workOrderId route exists yet, so this
    // reuses the list endpoint and finds the matching order here. Swap this for a
    // direct single-item fetch if/when that route gets added.
    const response = await api.get(`/landlord/workorders/${landlordId}`);
    const result = workOrderListSchema.safeParse(response.data);

    if (!result.success) {
      errorMessage = "Work order data came back in an unexpected shape.";
    } else {
      const found = result.data.find((item) => item.id === workOrderId);
      if (!found) {
        orderMissing = true;
      } else {
        order = found;
      }
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
        errorMessage = "Could not load this work order";
      }
    } else {
      errorMessage = "Something went wrong";
    }
  }

  // notFound() must be called outside the try/catch above — calling it inside would
  // let our own catch block swallow it and show "Something went wrong" instead of a
  // real 404. See the note at the top of this file.
  if (orderMissing) {
    notFound();
  }

  return (
    <Layout>
      <section>
        <Link href="/landlord/WorkOrders" className="text-sm text-[#FF5A3D]">
          ← Back to Work Orders
        </Link>

        {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}

        {!errorMessage && order && (
          <>
            <div className="mb-8 mt-4">
              <p className="text-[#FF5A3D] text-sm mb-2">• WORK ORDER DETAILS</p>
              <h1 className="text-3xl font-semibold">Order #{order.id}</h1>
              <p className="text-gray-500 mt-2">
                Created by {order.created_by_type} · {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm">Status</p>
                <p className="text-lg font-semibold mt-2 capitalize">{order.status}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm">Labor Cost</p>
                <p className="text-lg font-semibold mt-2">${Number(order.labor_cost ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm">Materials Cost</p>
                <p className="text-lg font-semibold mt-2">${Number(order.materials_cost ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm">Additional Cost</p>
                <p className="text-lg font-semibold mt-2">${Number(order.additional_cost ?? 0).toLocaleString()}</p>
              </div>
            </div>

            {order.completed_at && (
              <p className="text-gray-400 text-sm mt-6">
                Completed on {new Date(order.completed_at).toLocaleDateString()}
              </p>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}