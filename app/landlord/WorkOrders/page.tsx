"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

/* =========================================================
   COOKIE
========================================================= */

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(
    `; ${name}=`,
  );

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() ||
        "",
    );
  }

  return null;
}

/* =========================================================
   WORK ORDER
========================================================= */

const workOrderSchema = z.object({
  id: z.number(),

  status: z.string(),

  created_at: z.string(),

  labor_cost: z.union([
    z.string(),
    z.number(),
    z.null(),
  ]),

  materials_cost: z.union([
    z.string(),
    z.number(),
    z.null(),
  ]),

  additional_cost: z.union([
    z.string(),
    z.number(),
    z.null(),
  ]),
});

const workOrderListSchema =
  z.array(workOrderSchema);

type WorkOrder = z.infer<
  typeof workOrderSchema
>;

/* =========================================================
   TRANSACTION
========================================================= */

const transactionSchema = z.object({
  id: z.number(),

  type: z.string(),

  amount: z.union([
    z.string(),
    z.number(),
  ]),

  status: z.string(),

  payer_type: z
    .enum([
      "landlord",
      "tenant",
    ])
    .optional(),

  created_at: z.string(),

  paid_at: z
    .string()
    .nullable()
    .optional(),

  work_order_id: z
    .object({
      id: z.number(),
    })
    .nullable()
    .optional(),
});

const transactionListSchema =
  z.array(transactionSchema);

type Transaction = z.infer<
  typeof transactionSchema
>;

/* =========================================================
   DUPLICATES
========================================================= */

function removeDuplicateTransactions(
  list: Transaction[],
): Transaction[] {
  const seen = new Set<number>();

  return list.filter(
    (transaction) => {
      if (
        seen.has(transaction.id)
      ) {
        return false;
      }

      seen.add(transaction.id);

      return true;
    },
  );
}

/* =========================================================
   STATUS
========================================================= */

const statusStyle: Record<
  string,
  string
> = {
  pending:
    "bg-yellow-50 text-yellow-600",

  assigned:
    "bg-blue-50 text-blue-600",

  tenant_confirmed:
    "bg-purple-50 text-purple-600",

  complete:
    "bg-green-50 text-green-600",
};

const statusLabel: Record<
  string,
  string
> = {
  pending: "Pending",

  assigned: "Assigned",

  tenant_confirmed:
    "Tenant Confirmed",

  complete: "Complete",
};

const workOrderStatuses = [
  "pending",
  "assigned",
  "tenant_confirmed",
  "complete",
];

/* =========================================================
   PAGE
========================================================= */

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] =
    useState<WorkOrder[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [
    creatingPaymentId,
    setCreatingPaymentId,
  ] = useState<number | null>(null);

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData =
        getCookie("user");

      if (!userData) {
        setErrorMessage(
          "You are not logged in.",
        );

        setLoading(false);
        return;
      }

      let landlordId: number | null =
        null;

      try {
        landlordId =
          JSON.parse(
            userData,
          )?.id ?? null;
      } catch (error) {
        console.error(
          error,
        );
      }

      if (!landlordId) {
        setErrorMessage(
          "Could not find landlord id.",
        );

        setLoading(false);
        return;
      }

      try {
        /*
         * Get work orders and transactions
         * at the same time.
         */

        const [
          workOrderResponse,
          transactionResponse,
        ] = await Promise.all([
          api.get(
            `/landlord/workorders/${landlordId}`,
          ),

          api.get(
            `/landlord/transactions/${landlordId}`,
          ),
        ]);

        /* ===============================================
           WORK ORDERS
        =============================================== */

        const workOrderResult =
          workOrderListSchema.safeParse(
            workOrderResponse.data,
          );

        if (!workOrderResult.success) {
          console.error(
            workOrderResult.error,
          );

          setErrorMessage(
            "Work order data came back in an unexpected shape.",
          );

          return;
        }

        /* ===============================================
           TRANSACTIONS
        =============================================== */

        const transactionResult =
          transactionListSchema.safeParse(
            transactionResponse.data,
          );

        if (!transactionResult.success) {
          console.error(
            transactionResult.error,
          );

          setErrorMessage(
            "Transaction data came back in an unexpected shape.",
          );

          return;
        }

        setWorkOrders(
          workOrderResult.data,
        );

        setTransactions(
          removeDuplicateTransactions(
            transactionResult.data,
          ),
        );
      } catch (error) {
        if (
          axios.isAxiosError(error)
        ) {
          const message =
            error.response?.data
              ?.message;

          if (
            Array.isArray(message)
          ) {
            setErrorMessage(
              message[0],
            );
          } else if (
            typeof message ===
            "string"
          ) {
            setErrorMessage(
              message,
            );
          } else {
            setErrorMessage(
              "Could not load work orders.",
            );
          }
        } else {
          setErrorMessage(
            "Something went wrong.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* =======================================================
     FIND WORK ORDER TRANSACTION
  ======================================================= */

  const getWorkOrderTransaction =
    (workOrderId: number) => {
      return transactions.find(
        (transaction) =>
          transaction.work_order_id
            ?.id === workOrderId &&
          transaction.type ===
            "work_order_cost",
      );
    };

  /* =======================================================
     CREATE PAYMENT
  ======================================================= */

  const handleCreatePayment =
    async (
      workOrder: WorkOrder,
    ) => {
      const userData =
        getCookie("user");

      if (!userData) {
        setErrorMessage(
          "You are not logged in.",
        );

        return;
      }

      let landlordId: number | null =
        null;

      try {
        landlordId =
          JSON.parse(
            userData,
          )?.id ?? null;
      } catch (error) {
        console.error(
          error,
        );

        setErrorMessage(
          "Could not find landlord id.",
        );

        return;
      }

      if (!landlordId) {
        setErrorMessage(
          "Could not find landlord id.",
        );

        return;
      }

      const laborCost =
        Number(
          workOrder.labor_cost ??
            0,
        );

      const materialsCost =
        Number(
          workOrder.materials_cost ??
            0,
        );

      const additionalCost =
        Number(
          workOrder.additional_cost ??
            0,
        );

      const totalCost =
        laborCost +
        materialsCost +
        additionalCost;

      if (totalCost <= 0) {
        setErrorMessage(
          "This work order has no payment required.",
        );

        return;
      }

      try {
        setCreatingPaymentId(
          workOrder.id,
        );

        setErrorMessage("");

        /*
         * If a transaction already exists,
         * do not create another one.
         */

        const existingTransaction =
          getWorkOrderTransaction(
            workOrder.id,
          );

        if (existingTransaction) {
          setErrorMessage(
            `Payment transaction #${existingTransaction.id} already exists.`,
          );

          return;
        }

        /*
         * Create transaction.
         *
         * The backend saves:
         * type = work_order_cost
         * payer_type = landlord
         * status = pending
         * created_by_type = landlord
         */

        await api.post(
          `/landlord/work-order/transaction/${landlordId}/${workOrder.id}`,
        );

        /*
         * VERY IMPORTANT:
         * Reload transactions from database.
         */

        const response =
          await api.get(
            `/landlord/transactions/${landlordId}`,
          );

        const result =
          transactionListSchema.safeParse(
            response.data,
          );

        if (!result.success) {
          console.error(
            result.error,
          );

          setErrorMessage(
            "Payment was created but the transaction list could not be refreshed.",
          );

          return;
        }

        setTransactions(
          removeDuplicateTransactions(
            result.data,
          ),
        );
      } catch (error) {
        if (
          axios.isAxiosError(error)
        ) {
          const message =
            error.response?.data
              ?.message;

          if (
            Array.isArray(message)
          ) {
            setErrorMessage(
              message[0],
            );
          } else if (
            typeof message ===
            "string"
          ) {
            setErrorMessage(
              message,
            );
          } else {
            setErrorMessage(
              "Could not create payment transaction.",
            );
          }
        } else {
          setErrorMessage(
            "Something went wrong.",
          );
        }
      } finally {
        setCreatingPaymentId(
          null,
        );
      }
    };

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredWorkOrders =
    statusFilter === "all"
      ? workOrders
      : workOrders.filter(
          (workOrder) =>
            workOrder.status ===
            statusFilter,
        );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Layout>
      <section>

        {/* =================================================
           HEADER
        ================================================= */}

        <div className="mb-8">

          <p className="text-[#FF5A3D] text-sm mb-2">
            • MAINTENANCE MANAGEMENT
          </p>

          <h1 className="text-3xl font-semibold">
            Work Orders
          </h1>

          <p className="text-gray-500 mt-2">
            Create and track work
            orders from issues.
          </p>

        </div>

        {/* =================================================
           FILTER
        ================================================= */}

        <div className="flex flex-wrap gap-2 mb-6">

          <button
            onClick={() =>
              setStatusFilter(
                "all",
              )
            }
            className={`text-xs px-3 py-1.5 rounded-full border ${
              statusFilter ===
              "all"
                ? "bg-[#FF5A3D] text-white border-[#FF5A3D]"
                : "border-gray-300 text-gray-600"
            }`}
          >
            All
          </button>

          {workOrderStatuses.map(
            (status) => (

              <button
                key={`filter-${status}`}
                onClick={() =>
                  setStatusFilter(
                    status,
                  )
                }
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  statusFilter ===
                  status
                    ? "bg-[#FF5A3D] text-white border-[#FF5A3D]"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                {
                  statusLabel[
                    status
                  ]
                }
              </button>

            ),
          )}

        </div>

        {/* =================================================
           ERROR
        ================================================= */}

        {errorMessage && (

          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            {
              errorMessage
            }
          </div>

        )}

        {/* =================================================
           LOADING
        ================================================= */}

        {loading && (
          <p className="text-gray-500">
            Loading work orders...
          </p>
        )}

        {/* =================================================
           EMPTY
        ================================================= */}

        {!loading &&
          !errorMessage &&
          filteredWorkOrders.length ===
            0 && (

            <p className="text-gray-500">
              No work orders found.
            </p>

          )}

        {/* =================================================
           WORK ORDERS
        ================================================= */}

        {!loading &&
          filteredWorkOrders.length >
            0 && (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredWorkOrders.map(
              (workOrder) => {

                const laborCost =
                  Number(
                    workOrder.labor_cost ??
                      0,
                  );

                const materialsCost =
                  Number(
                    workOrder.materials_cost ??
                      0,
                  );

                const additionalCost =
                  Number(
                    workOrder.additional_cost ??
                      0,
                  );

                const totalCost =
                  laborCost +
                  materialsCost +
                  additionalCost;

                const transaction =
                  getWorkOrderTransaction(
                    workOrder.id,
                  );

                const isPending =
                  transaction?.status ===
                  "pending";

                const isPaid =
                  transaction?.status ===
                  "paid";

                return (

                  <div
                    key={`work-order-${workOrder.id}`}
                    className="bg-white border border-gray-200 rounded-xl p-6"
                  >

                    {/* =============================
                        HEADER
                    ============================= */}

                    <div className="flex items-center justify-between">

                      <h3 className="font-semibold">
                        Work Order #
                        {
                          workOrder.id
                        }
                      </h3>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusStyle[
                            workOrder.status
                          ] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {
                          statusLabel[
                            workOrder.status
                          ] ??
                          workOrder.status
                        }
                      </span>

                    </div>

                    <p className="text-gray-400 text-xs mt-3">
                      Created{" "}
                      {new Date(
                        workOrder.created_at,
                      ).toLocaleDateString()}
                    </p>

                    {/* =============================
                        COST
                    ============================= */}

                    <div className="border-t border-gray-100 mt-5 pt-5">

                      <p className="text-sm font-medium mb-3">
                        Work Order Cost
                      </p>

                      <div className="flex justify-between text-sm mt-2">

                        <span className="text-gray-500">
                          Labor Cost
                        </span>

                        <span>
                          $
                          {
                            laborCost.toLocaleString()
                          }
                        </span>

                      </div>

                      <div className="flex justify-between text-sm mt-2">

                        <span className="text-gray-500">
                          Materials Cost
                        </span>

                        <span>
                          $
                          {
                            materialsCost.toLocaleString()
                          }
                        </span>

                      </div>

                      <div className="flex justify-between text-sm mt-2">

                        <span className="text-gray-500">
                          Additional Cost
                        </span>

                        <span>
                          $
                          {
                            additionalCost.toLocaleString()
                          }
                        </span>

                      </div>

                      <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">

                        <span className="font-semibold">
                          Total Cost
                        </span>

                        <span className="font-semibold">
                          $
                          {
                            totalCost.toLocaleString()
                          }
                        </span>

                      </div>

                    </div>

                    {/* =============================
                        PAYMENT
                    ============================= */}

                    <div className="border-t border-gray-100 mt-5 pt-5">

                      <p className="text-sm font-medium mb-3">
                        Payment
                      </p>

                      {/* NO COST */}

                      {totalCost <=
                        0 && (

                        <div className="bg-gray-50 text-gray-500 rounded-lg p-3 text-sm text-center">
                          No payment required
                        </div>

                      )}

                      {/* NO TRANSACTION */}

                      {totalCost > 0 &&
                        !transaction && (

                        <div>

                          <div className="bg-blue-50 border border-blue-100 text-blue-600 rounded-lg p-3 text-sm">

                            <p className="font-medium">
                              Payment Not Created
                            </p>

                            <p className="mt-1">
                              Amount: $
                              {
                                totalCost.toLocaleString()
                              }
                            </p>

                          </div>

                          <button
                            onClick={() =>
                              handleCreatePayment(
                                workOrder,
                              )
                            }
                            disabled={
                              creatingPaymentId ===
                              workOrder.id
                            }
                            className="w-full mt-3 bg-[#FF5A3D] text-white py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                          >

                            {creatingPaymentId ===
                            workOrder.id
                              ? "Creating Payment..."
                              : "Create Payment"}

                          </button>

                        </div>

                      )}

                      {/* =============================
                          PAYMENT PENDING
                      ============================= */}

                      {totalCost > 0 &&
                        transaction &&
                        isPending && (

                        <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 rounded-lg p-3 text-sm">

                          <p className="font-medium">
                            Payment Pending
                          </p>

                          <p className="mt-1">
                            Amount: $
                            {
                              Number(
                                transaction.amount,
                              ).toLocaleString()
                            }
                          </p>

                          <p className="text-xs mt-2">
                            Transaction #
                            {
                              transaction.id
                            }
                          </p>

                        </div>

                      )}

                      {/* =============================
                          PAYMENT PAID
                      ============================= */}

                      {totalCost > 0 &&
                        transaction &&
                        isPaid && (

                        <div className="bg-green-50 border border-green-100 text-green-600 rounded-lg p-3 text-sm text-center">

                          <p className="font-medium">
                            Payment Completed
                          </p>

                          <p className="mt-1">
                            $
                            {
                              Number(
                                transaction.amount,
                              ).toLocaleString()
                            }
                          </p>

                          <p className="text-xs mt-2">
                            Transaction #
                            {
                              transaction.id
                            }
                          </p>

                        </div>

                      )}

                    </div>

                    {/* =============================
                        DETAILS
                    ============================= */}

                    <Link
                      href={`/landlord/WorkOrders/${workOrder.id}`}
                      className="block text-center mt-4 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
                    >
                      View Details
                    </Link>

                  </div>

                );
              },
            )}

          </div>
        )}

      </section>
    </Layout>
  );
}