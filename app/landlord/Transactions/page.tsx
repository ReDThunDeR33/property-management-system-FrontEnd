import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

export const dynamic = "force-dynamic";

const transactionSchema = z.object({
  id: z.number(),
  type: z.string(),
  amount: z.union([z.string(), z.number()]),
  payer_type: z.string(),
  status: z.string(),
  created_by_type: z.string(),
  created_at: z.string(),
  paid_at: z.string().nullable(),
});

const transactionListSchema = z.array(transactionSchema);
type Transaction = z.infer<typeof transactionSchema>;

const statusStyle: Record<string, string> = {
  paid: "bg-green-50 text-green-600",
  pending: "bg-yellow-50 text-yellow-600",
  rejected: "bg-red-50 text-red-600",
};

export default async function TransactionsPage() {
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
  let transactions: Transaction[] = [];

  try {
    const response = await api.get(`/landlord/transactions/${landlordId}`);
    const result = transactionListSchema.safeParse(response.data);

    if (!result.success) {
      errorMessage = "Transaction data came back in an unexpected shape.";
    } else {
      transactions = result.data;
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
        errorMessage = "Could not load transactions";
      }
    } else {
      errorMessage = "Something went wrong";
    }
  }

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• FINANCIAL OVERVIEW</p>
          <h1 className="text-3xl font-semibold">Transactions</h1>
          <p className="text-gray-500 mt-2">Rent, service charges, parking, and work order costs.</p>
        </div>

        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {!errorMessage && transactions.length === 0 && (
          <p className="text-gray-500">No transactions found.</p>
        )}

        {!errorMessage && transactions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold capitalize">{tx.type.replace("_", " ")}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      statusStyle[tx.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <p className="text-2xl font-semibold mt-2">${Number(tx.amount).toLocaleString()}</p>
                <p className="text-gray-500 text-sm mt-2">Paid by: {tx.payer_type}</p>
                <p className="text-gray-400 text-xs mt-3">
                  Created {new Date(tx.created_at).toLocaleDateString()}
                  {tx.paid_at ? ` · Paid ${new Date(tx.paid_at).toLocaleDateString()}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}