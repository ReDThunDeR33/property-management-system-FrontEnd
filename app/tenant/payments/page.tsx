"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() || ""
    );
  }

  return null;
}

const transactionSchema = z.object({
  id: z.number(),
  type: z.string(),
  amount: z.union([z.string(), z.number()]),
  payer_type: z.string(),
  status: z.string(),
  created_at: z.string(),
  paid_at: z.string().nullable().optional(),
});

const transactionListSchema = z.array(transactionSchema);

type Transaction = z.infer<typeof transactionSchema>;

const workOrderSchema = z
  .object({
    id: z.number(),
    labor_cost: z.union([z.string(), z.number()]).optional(),
    materials_cost: z.union([z.string(), z.number()]).optional(),
    additional_cost: z.union([z.string(), z.number()]).optional(),
    status: z.string().optional(),
    created_at: z.string().optional(),

    issue: z
      .object({
        id: z.number().optional(),
        description: z.string().optional(),
      })
      .nullable()
      .optional(),

    property: z
      .object({
        id: z.number().optional(),
        unit_number: z.string().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

const workOrderListSchema = z.array(workOrderSchema);

type WorkOrder = z.infer<typeof workOrderSchema>;

const statusStyle: Record<string, string> = {
  paid: "bg-green-50 text-green-600",
  pending: "bg-yellow-50 text-yellow-600",
  rejected: "bg-red-50 text-red-600",

  PAID: "bg-green-50 text-green-600",
  PENDING: "bg-yellow-50 text-yellow-600",
  REJECTED: "bg-red-50 text-red-600",
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  const [tenantId, setTenantId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [payingTransactionId, setPayingTransactionId] =
    useState<number | null>(null);

  const [payingWorkOrderId, setPayingWorkOrderId] =
    useState<number | null>(null);

  const [paymentError, setPaymentError] = useState("");

  const fetchPaymentData = async (id: number) => {
    try {
      const transactionResponse = await api.get(
        `/tenant/transactions/${id}`
      );

      const transactionResult =
        transactionListSchema.safeParse(
          transactionResponse.data
        );

      if (!transactionResult.success) {
        setErrorMessage(
          "Transaction data came back in an unexpected shape."
        );
        return;
      }

      const workOrderResponse = await api.get(
        `/tenant/work-orders/payable/${id}`
      );

      const workOrderResult =
        workOrderListSchema.safeParse(
          workOrderResponse.data
        );

      if (!workOrderResult.success) {
        setErrorMessage(
          "Work order data came back in an unexpected shape."
        );
        return;
      }

      setTransactions(transactionResult.data);
      setWorkOrders(workOrderResult.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
          setErrorMessage(backendMessage[0]);
        } else if (
          typeof backendMessage === "string"
        ) {
          setErrorMessage(backendMessage);
        } else if (!error.response) {
          setErrorMessage(
            "Cannot connect to the backend"
          );
        } else {
          setErrorMessage(
            "Could not load payment information"
          );
        }
      } else {
        setErrorMessage("Something went wrong");
      }
    }
  };

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData = getCookie("user");

      if (!userData) {
        setErrorMessage("You are not logged in.");
        setLoading(false);
        return;
      }

      let id: number | null = null;

      try {
        id = JSON.parse(userData)?.id ?? null;
      } catch (err) {
        console.error(
          "Error parsing user cookie:",
          err
        );
      }

      if (!id) {
        setErrorMessage(
          "Could not find tenant id."
        );
        setLoading(false);
        return;
      }

      setTenantId(id);

      await fetchPaymentData(id);

      setLoading(false);
    };

    loadPayments();
  }, []);

  const handleTransactionPayment = async (
    transactionId: number
  ) => {
    if (!tenantId) return;

    setPayingTransactionId(transactionId);
    setPaymentError("");

    try {
      await api.patch(
        `/tenant/payment/${tenantId}/${transactionId}`
      );

      await fetchPaymentData(tenantId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
          setPaymentError(backendMessage[0]);
        } else if (
          typeof backendMessage === "string"
        ) {
          setPaymentError(backendMessage);
        } else {
          setPaymentError(
            "Could not complete payment."
          );
        }
      } else {
        setPaymentError(
          "Something went wrong."
        );
      }
    } finally {
      setPayingTransactionId(null);
    }
  };

  const handleWorkOrderPayment = async (
    workOrderId: number
  ) => {
    if (!tenantId) return;

    setPayingWorkOrderId(workOrderId);
    setPaymentError("");

    try {
      await api.post(
        `/tenant/work-order/pay/${tenantId}/${workOrderId}`
      );

      await fetchPaymentData(tenantId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
          setPaymentError(backendMessage[0]);
        } else if (
          typeof backendMessage === "string"
        ) {
          setPaymentError(backendMessage);
        } else {
          setPaymentError(
            "Could not pay work order."
          );
        }
      } else {
        setPaymentError(
          "Something went wrong."
        );
      }
    } finally {
      setPayingWorkOrderId(null);
    }
  };

  const pendingTransactions = transactions.filter(
    (transaction) =>
      transaction.status.toLowerCase() === "pending"
  );

  const paidTransactions = transactions.filter(
    (transaction) =>
      transaction.status.toLowerCase() === "paid"
  );

  const pendingAmount = pendingTransactions.reduce(
    (total, transaction) =>
      total + Number(transaction.amount),
    0
  );

  const paidAmount = paidTransactions.reduce(
    (total, transaction) =>
      total + Number(transaction.amount),
    0
  );

  const getWorkOrderAmount = (
    workOrder: WorkOrder
  ) => {
    return (
      Number(workOrder.labor_cost || 0) +
      Number(workOrder.materials_cost || 0) +
      Number(workOrder.additional_cost || 0)
    );
  };

  const payableWorkOrderAmount =
    workOrders.reduce(
      (total, workOrder) =>
        total + getWorkOrderAmount(workOrder),
      0
    );

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">
            • PAYMENT OVERVIEW
          </p>

          <h1 className="text-3xl font-semibold">
            Payments
          </h1>

          <p className="text-gray-500 mt-2">
            View your bills, transaction history,
            and payable maintenance charges.
          </p>
        </div>

        {loading && (
          <p className="text-gray-500">
            Loading payments...
          </p>
        )}

        {!loading && errorMessage && (
          <p className="text-red-500">
            {errorMessage}
          </p>
        )}

        {!loading && !errorMessage && (
          <>
            {/* Summary Cards */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500">
                  Pending Transactions
                </p>

                <p className="text-3xl font-semibold mt-2">
                  ৳
                  {pendingAmount.toLocaleString()}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {pendingTransactions.length} unpaid
                  transaction
                  {pendingTransactions.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500">
                  Paid Amount
                </p>

                <p className="text-3xl font-semibold mt-2 text-green-600">
                  ৳{paidAmount.toLocaleString()}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {paidTransactions.length} completed
                  payment
                  {paidTransactions.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500">
                  Work Order Due
                </p>

                <p className="text-3xl font-semibold mt-2">
                  ৳
                  {payableWorkOrderAmount.toLocaleString()}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {workOrders.length} payable work
                  order
                  {workOrders.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>

            {paymentError && (
              <p className="text-red-500 mb-6">
                {paymentError}
              </p>
            )}

            {/* Pending Transactions */}

            <div className="mb-12">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">
                  Pending Payments
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Rent, gas, electricity, service
                  charge and other unpaid bills.
                </p>
              </div>

              {pendingTransactions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <p className="text-gray-500">
                    No pending transactions.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingTransactions.map(
                    (transaction) => (
                      <div
                        key={transaction.id}
                        className="bg-white border border-gray-200 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold capitalize">
                            {transaction.type.replaceAll(
                              "_",
                              " "
                            )}
                          </h3>

                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              statusStyle[
                                transaction.status
                              ] ??
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </div>

                        <p className="text-2xl font-semibold mt-3">
                          ৳
                          {Number(
                            transaction.amount
                          ).toLocaleString()}
                        </p>

                        <p className="text-gray-500 text-sm mt-2 capitalize">
                          Payer:{" "}
                          {transaction.payer_type}
                        </p>

                        <p className="text-gray-400 text-xs mt-3">
                          Created{" "}
                          {new Date(
                            transaction.created_at
                          ).toLocaleDateString()}
                        </p>

                        <button
                          onClick={() =>
                            handleTransactionPayment(
                              transaction.id
                            )
                          }
                          disabled={
                            payingTransactionId ===
                            transaction.id
                          }
                          className="mt-5 w-full bg-[#FF5A3D] text-white px-4 py-2.5 rounded-lg hover:bg-[#e94e34] transition disabled:opacity-60"
                        >
                          {payingTransactionId ===
                          transaction.id
                            ? "Paying..."
                            : "Pay Now"}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Payable Work Orders */}

            <div className="mb-12">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">
                  Maintenance Charges
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Work order charges assigned to you
                  as the payer.
                </p>
              </div>

              {workOrders.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <p className="text-gray-500">
                    No payable work orders.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workOrders.map((workOrder) => {
                    const amount =
                      getWorkOrderAmount(workOrder);

                    return (
                      <div
                        key={workOrder.id}
                        className="bg-white border border-gray-200 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">
                            Work Order #
                            {workOrder.id}
                          </h3>

                          {workOrder.status && (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-600">
                              {workOrder.status}
                            </span>
                          )}
                        </div>

                        {workOrder.issue
                          ?.description && (
                          <p className="text-gray-500 text-sm mt-3">
                            {
                              workOrder.issue
                                .description
                            }
                          </p>
                        )}

                        {workOrder.property
                          ?.unit_number && (
                          <p className="text-gray-500 text-sm mt-2">
                            Property:{" "}
                            {
                              workOrder.property
                                .unit_number
                            }
                          </p>
                        )}

                        <p className="text-2xl font-semibold mt-4">
                          ৳
                          {amount.toLocaleString()}
                        </p>

                        <div className="text-xs text-gray-400 mt-3 space-y-1">
                          <p>
                            Labor: ৳
                            {Number(
                              workOrder.labor_cost ||
                                0
                            ).toLocaleString()}
                          </p>

                          <p>
                            Materials: ৳
                            {Number(
                              workOrder.materials_cost ||
                                0
                            ).toLocaleString()}
                          </p>

                          <p>
                            Additional: ৳
                            {Number(
                              workOrder.additional_cost ||
                                0
                            ).toLocaleString()}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleWorkOrderPayment(
                              workOrder.id
                            )
                          }
                          disabled={
                            payingWorkOrderId ===
                            workOrder.id
                          }
                          className="mt-5 w-full bg-[#FF5A3D] text-white px-4 py-2.5 rounded-lg hover:bg-[#e94e34] transition disabled:opacity-60"
                        >
                          {payingWorkOrderId ===
                          workOrder.id
                            ? "Paying..."
                            : "Pay Work Order"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment History */}

            <div>
              <div className="mb-5">
                <h2 className="text-xl font-semibold">
                  Payment History
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Transactions you have already paid.
                </p>
              </div>

              {paidTransactions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <p className="text-gray-500">
                    No completed payments yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paidTransactions.map(
                    (transaction) => (
                      <div
                        key={transaction.id}
                        className="bg-white border border-gray-200 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold capitalize">
                            {transaction.type.replaceAll(
                              "_",
                              " "
                            )}
                          </h3>

                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">
                            Paid
                          </span>
                        </div>

                        <p className="text-2xl font-semibold mt-3">
                          ৳
                          {Number(
                            transaction.amount
                          ).toLocaleString()}
                        </p>

                        <p className="text-gray-500 text-sm mt-2 capitalize">
                          Payer:{" "}
                          {transaction.payer_type}
                        </p>

                        <p className="text-gray-400 text-xs mt-3">
                          {transaction.paid_at
                            ? `Paid ${new Date(
                                transaction.paid_at
                              ).toLocaleDateString()}`
                            : `Created ${new Date(
                                transaction.created_at
                              ).toLocaleDateString()}`}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}