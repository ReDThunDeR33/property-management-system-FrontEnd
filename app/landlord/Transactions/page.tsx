"use client";

import { useEffect, useState, FormEvent } from "react";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }

  return null;
}

/* =========================================================
   TRANSACTION SCHEMA
========================================================= */

const transactionSchema = z.object({
  id: z.number(),
  type: z.string(),
  amount: z.union([z.string(), z.number()]),
  payer_type: z.string(),
  status: z.string(),
  created_by_type: z.string(),
  created_at: z.string(),
  paid_at: z.string().nullable(),
  work_order_id: z
    .object({
      id: z.number(),
    })
    .nullable()
    .optional(),
});

const transactionListSchema = z.array(transactionSchema);

type Transaction = z.infer<typeof transactionSchema>;

/* =========================================================
   TENANT SCHEMA
========================================================= */

const tenantSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const tenantListSchema = z.array(tenantSchema);

type Tenant = z.infer<typeof tenantSchema>;

/* =========================================================
   WORK ORDER SCHEMA
========================================================= */

const workOrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  created_at: z.string(),
  labor_cost: z.union([z.string(), z.number(), z.null()]),
  materials_cost: z.union([z.string(), z.number(), z.null()]),
  additional_cost: z.union([z.string(), z.number(), z.null()]),
});

const workOrderListSchema = z.array(workOrderSchema);

type WorkOrder = z.infer<typeof workOrderSchema>;

/* =========================================================
   STATUS STYLE
========================================================= */

const statusStyle: Record<string, string> = {
  paid: "bg-green-50 text-green-600",
  pending: "bg-yellow-50 text-yellow-600",
  rejected: "bg-red-50 text-red-600",
};

/* =========================================================
   UTILITY BILL TYPES
========================================================= */

const utilityBillTypes = new Set([
  "electricity",
  "water",
  "gas",
  "service_charge",
  "parking",
]);

/* =========================================================
   PAGE
========================================================= */

export default function TransactionsPage() {
  /* =======================================================
     TRANSACTIONS
  ======================================================= */

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [landlordId, setLandlordId] = useState<number | null>(null);

  /* =======================================================
     WORK ORDER TRANSACTION
  ======================================================= */

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(true);
  const [workOrdersError, setWorkOrdersError] = useState("");

  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");

  const [creatingWorkOrderPayment, setCreatingWorkOrderPayment] =
    useState(false);

  const [workOrderCreateError, setWorkOrderCreateError] = useState("");
  const [workOrderCreateSuccess, setWorkOrderCreateSuccess] = useState("");

  /* =======================================================
     PAY UTILITY BILL
  ======================================================= */

  const [payingId, setPayingId] = useState<number | null>(null);

  const [payError, setPayError] = useState<Record<number, string>>({});

  const [paySuccess, setPaySuccess] = useState("");

  /* =======================================================
     TENANT TRANSACTIONS
  ======================================================= */

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsError, setTenantsError] = useState("");

  const [selectedTenantId, setSelectedTenantId] = useState("");

  const [tenantTransactions, setTenantTransactions] = useState<
    Transaction[]
  >([]);

  const [tenantTxLoading, setTenantTxLoading] = useState(false);
  const [tenantTxError, setTenantTxError] = useState("");

  const [hasSearchedTenant, setHasSearchedTenant] = useState(false);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData = getCookie("user");

      if (!userData) {
        setErrorMessage("You are not logged in.");
        setLoading(false);
        setWorkOrdersLoading(false);
        setTenantsLoading(false);
        return;
      }

      let currentLandlordId: number | null = null;

      try {
        currentLandlordId = JSON.parse(userData)?.id ?? null;
      } catch (error) {
        console.error("Error parsing user cookie:", error);
      }

      if (!currentLandlordId) {
        setErrorMessage("Could not find landlord id.");
        setLoading(false);
        setWorkOrdersLoading(false);
        setTenantsLoading(false);
        return;
      }

      setLandlordId(currentLandlordId);

      /* =====================================================
         FETCH TRANSACTIONS
      ===================================================== */

      try {
        const response = await api.get(
          `/landlord/transactions/${currentLandlordId}`
        );

        const result = transactionListSchema.safeParse(response.data);

        if (!result.success) {
          setErrorMessage(
            "Transaction data came back in an unexpected shape."
          );
          setLoading(false);
          return;
        }

        setTransactions(result.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const backendMessage = error.response?.data?.message;

          if (Array.isArray(backendMessage)) {
            setErrorMessage(backendMessage[0]);
          } else if (typeof backendMessage === "string") {
            setErrorMessage(backendMessage);
          } else if (!error.response) {
            setErrorMessage("Cannot connect to the backend");
          } else {
            setErrorMessage("Could not load transactions");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }

      /* =====================================================
         FETCH WORK ORDERS
      ===================================================== */

      try {
        setWorkOrdersLoading(true);
        setWorkOrdersError("");

        const response = await api.get(
          `/landlord/workorders/${currentLandlordId}`
        );

        const result = workOrderListSchema.safeParse(response.data);

        if (!result.success) {
          setWorkOrdersError(
            "Work order data came back in an unexpected shape."
          );
          return;
        }

        setWorkOrders(result.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const backendMessage = error.response?.data?.message;

          if (Array.isArray(backendMessage)) {
            setWorkOrdersError(backendMessage[0]);
          } else if (typeof backendMessage === "string") {
            setWorkOrdersError(backendMessage);
          } else if (!error.response) {
            setWorkOrdersError("Cannot connect to the backend");
          } else {
            setWorkOrdersError("Could not load work orders");
          }
        } else {
          setWorkOrdersError("Something went wrong");
        }
      } finally {
        setWorkOrdersLoading(false);
      }

      /* =====================================================
         FETCH TENANTS
      ===================================================== */

      try {
        setTenantsLoading(true);
        setTenantsError("");

        const tenantRes = await api.get(
          `/landlord/tenants/${currentLandlordId}`
        );

        const tenantResult = tenantListSchema.safeParse(tenantRes.data);

        if (!tenantResult.success) {
          setTenantsError(
            "Tenant data came back in an unexpected shape."
          );
          return;
        }

        setTenants(tenantResult.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const backendMessage = error.response?.data?.message;

          if (Array.isArray(backendMessage)) {
            setTenantsError(backendMessage[0]);
          } else if (typeof backendMessage === "string") {
            setTenantsError(backendMessage);
          } else if (!error.response) {
            setTenantsError("Cannot connect to the backend");
          } else {
            setTenantsError("Could not load tenants");
          }
        } else {
          setTenantsError("Something went wrong");
        }
      } finally {
        setTenantsLoading(false);
      }
    };

    fetchData();
  }, []);

  /* =======================================================
     CREATE WORK ORDER TRANSACTION
  ======================================================= */

  const handleCreateWorkOrderTransaction = async (e: FormEvent) => {
    e.preventDefault();

    if (!landlordId || !selectedWorkOrderId) {
      return;
    }

    setCreatingWorkOrderPayment(true);
    setWorkOrderCreateError("");
    setWorkOrderCreateSuccess("");

    try {
      const workOrderId = Number(selectedWorkOrderId);

      const response = await api.post(
        `/landlord/work-order/transaction/${landlordId}/${workOrderId}`
      );

      const result = transactionSchema.safeParse(response.data);

      if (!result.success) {
        setWorkOrderCreateError(
          "Transaction was created, but the returned data is invalid."
        );
        return;
      }

      /* Add newly-created transaction to the list */
      setTransactions((prev) => [result.data, ...prev]);

      setWorkOrderCreateSuccess(
        `Payment transaction created for Work Order #${workOrderId}.`
      );

      setSelectedWorkOrderId("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
          setWorkOrderCreateError(backendMessage[0]);
        } else if (typeof backendMessage === "string") {
          setWorkOrderCreateError(backendMessage);
        } else if (!error.response) {
          setWorkOrderCreateError("Cannot connect to the backend.");
        } else {
          setWorkOrderCreateError(
            "Could not create work order transaction."
          );
        }
      } else {
        setWorkOrderCreateError("Something went wrong.");
      }
    } finally {
      setCreatingWorkOrderPayment(false);
    }
  };

  /* =======================================================
     PAY UTILITY BILL
  ======================================================= */

  const handlePayUtilityBill = async (transactionId: number) => {
    if (!landlordId) {
      return;
    }

    setPayError((prev) => ({
      ...prev,
      [transactionId]: "",
    }));

    setPaySuccess("");
    setPayingId(transactionId);

    try {
      const response = await api.patch(
        `/landlord/utility-bill/pay/${landlordId}/${transactionId}`,
        {}
      );

      const result = transactionSchema.safeParse(response.data);

      if (result.success) {
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transactionId ? result.data : tx
          )
        );
      } else {
        const refreshed = await api.get(
          `/landlord/transactions/${landlordId}`
        );

        const refreshedResult = transactionListSchema.safeParse(
          refreshed.data
        );

        if (refreshedResult.success) {
          setTransactions(refreshedResult.data);
        }
      }

      setPaySuccess(`Bill #${transactionId} paid successfully.`);
    } catch (error) {
      let message = "Could not pay this bill";

      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
          message = backendMessage[0];
        } else if (typeof backendMessage === "string") {
          message = backendMessage;
        } else if (!error.response) {
          message = "Cannot connect to the backend";
        }
      } else {
        message = "Something went wrong";
      }

      setPayError((prev) => ({
        ...prev,
        [transactionId]: message,
      }));
    } finally {
      setPayingId(null);
    }
  };

  /* =======================================================
     LOAD TENANT TRANSACTIONS
  ======================================================= */

  const handleLoadTenantTransactions = async (e: FormEvent) => {
    e.preventDefault();

    if (!landlordId || !selectedTenantId) {
      return;
    }

    setTenantTxLoading(true);
    setTenantTxError("");
    setTenantTransactions([]);
    setHasSearchedTenant(true);

    try {
      const response = await api.get(
        `/landlord/tenant/transactions/${landlordId}/${selectedTenantId}`
      );

      const result = transactionListSchema.safeParse(response.data);

      if (!result.success) {
        setTenantTxError(
          "Transaction data came back in an unexpected shape."
        );
        return;
      }

      setTenantTransactions(result.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
          setTenantTxError(backendMessage[0]);
        } else if (typeof backendMessage === "string") {
          setTenantTxError(backendMessage);
        } else if (!error.response) {
          setTenantTxError("Cannot connect to the backend");
        } else {
          setTenantTxError(
            "Could not load transactions for this tenant"
          );
        }
      } else {
        setTenantTxError("Something went wrong");
      }
    } finally {
      setTenantTxLoading(false);
    }
  };

  /* =======================================================
     FILTER TRANSACTIONS
  ======================================================= */

  const landlordBills = transactions.filter(
    (tx) => tx.payer_type === "landlord"
  );

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <Layout>
      <section>
        {/* =================================================
           PAGE HEADER
        ================================================= */}

        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">
            • FINANCIAL OVERVIEW
          </p>

          <h1 className="text-3xl font-semibold">
            Transactions
          </h1>

          <p className="text-gray-500 mt-2">
            Rent, service charges, parking, utility bills, and
            work order costs.
          </p>
        </div>

        {/* =================================================
           CREATE WORK ORDER PAYMENT
        ================================================= */}

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Create Work Order Payment
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Select a work order to create a payment transaction
              for its costs.
            </p>
          </div>

          <form
            onSubmit={handleCreateWorkOrderTransaction}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          >
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500 block mb-1">
                Work Order
              </label>

              {workOrdersLoading ? (
                <p className="text-gray-500 text-sm">
                  Loading work orders...
                </p>
              ) : workOrdersError ? (
                <p className="text-red-500 text-sm">
                  {workOrdersError}
                </p>
              ) : (
                <select
                  value={selectedWorkOrderId}
                  onChange={(e) => {
                    setSelectedWorkOrderId(e.target.value);
                    setWorkOrderCreateError("");
                    setWorkOrderCreateSuccess("");
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">
                    Select a work order
                  </option>

                  {workOrders.map((workOrder) => {
                    const labor = Number(
                      workOrder.labor_cost ?? 0
                    );

                    const materials = Number(
                      workOrder.materials_cost ?? 0
                    );

                    const additional = Number(
                      workOrder.additional_cost ?? 0
                    );

                    const total =
                      labor + materials + additional;

                    return (
                      <option
                        key={workOrder.id}
                        value={workOrder.id}
                        disabled={total <= 0}
                      >
                        Work Order #{workOrder.id} —{" "}
                        {workOrder.status} — $
                        {total.toLocaleString()}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={
                creatingWorkOrderPayment ||
                !selectedWorkOrderId ||
                workOrdersLoading
              }
              className="bg-[#FF5A3D] text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {creatingWorkOrderPayment
                ? "Creating..."
                : "Create Payment"}
            </button>
          </form>

          {/* =================================================
             SELECTED WORK ORDER COST BREAKDOWN
          ================================================= */}

          {selectedWorkOrderId && (
            <div className="mt-5">
              {(() => {
                const selectedWorkOrder = workOrders.find(
                  (workOrder) =>
                    workOrder.id === Number(selectedWorkOrderId)
                );

                if (!selectedWorkOrder) {
                  return null;
                }

                const labor = Number(
                  selectedWorkOrder.labor_cost ?? 0
                );

                const materials = Number(
                  selectedWorkOrder.materials_cost ?? 0
                );

                const additional = Number(
                  selectedWorkOrder.additional_cost ?? 0
                );

                const total =
                  labor + materials + additional;

                return (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">
                        Work Order #{selectedWorkOrder.id}
                      </h3>

                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {selectedWorkOrder.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">
                          Labor Cost
                        </p>

                        <p className="font-semibold">
                          ${labor.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Materials Cost
                        </p>

                        <p className="font-semibold">
                          ${materials.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Additional Cost
                        </p>

                        <p className="font-semibold">
                          ${additional.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Total Payment
                        </p>

                        <p className="text-xl font-semibold text-[#FF5A3D]">
                          ${total.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {total <= 0 && (
                      <p className="text-red-500 text-sm mt-3">
                        This work order has no cost, so a payment
                        transaction cannot be created.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {workOrderCreateError && (
            <p className="text-red-500 text-sm mt-3">
              {workOrderCreateError}
            </p>
          )}

          {workOrderCreateSuccess && (
            <p className="text-green-600 text-sm mt-3">
              {workOrderCreateSuccess}
            </p>
          )}
        </div>

        {/* =================================================
           TENANT TRANSACTIONS
        ================================================= */}

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-1">
            Tenant Transactions
          </h2>

          <p className="text-gray-500 text-sm mb-4">
            View all transactions for a specific tenant under
            your properties. These are view-only.
          </p>

          <form
            onSubmit={handleLoadTenantTransactions}
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <div className="flex-1">
              <label className="text-sm text-gray-500 block mb-1">
                Tenant
              </label>

              {tenantsLoading ? (
                <p className="text-gray-500 text-sm">
                  Loading tenants...
                </p>
              ) : tenantsError ? (
                <p className="text-red-500 text-sm">
                  {tenantsError}
                </p>
              ) : (
                <select
                  value={selectedTenantId}
                  onChange={(e) =>
                    setSelectedTenantId(e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">
                    Select a tenant
                  </option>

                  {tenants.map((tenant) => (
                    <option
                      key={tenant.id}
                      value={tenant.id}
                    >
                      {tenant.name} (#{tenant.id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={
                !selectedTenantId || tenantTxLoading
              }
              className="text-sm px-4 py-2 rounded-lg bg-[#FF5A3D] text-white disabled:opacity-50 whitespace-nowrap"
            >
              {tenantTxLoading
                ? "Loading..."
                : "View Transactions"}
            </button>
          </form>

          {tenantTxError && (
            <p className="text-red-500 text-sm mt-4">
              {tenantTxError}
            </p>
          )}

          {!tenantTxLoading &&
            !tenantTxError &&
            tenantTransactions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {tenantTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize text-sm">
                        {tx.type.replace("_", " ")}
                      </h4>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusStyle[tx.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <p className="text-xl font-semibold mt-2">
                      $
                      {Number(tx.amount).toLocaleString()}
                    </p>

                    <p className="text-gray-500 text-xs mt-1">
                      Paid by: {tx.payer_type}
                    </p>

                    <p className="text-gray-400 text-xs mt-2">
                      Created{" "}
                      {new Date(
                        tx.created_at
                      ).toLocaleDateString()}
                      {tx.paid_at
                        ? ` · Paid ${new Date(
                            tx.paid_at
                          ).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}

          {!tenantTxLoading &&
            !tenantTxError &&
            hasSearchedTenant &&
            tenantTransactions.length === 0 && (
              <p className="text-gray-500 text-sm mt-4">
                No transactions found for this tenant.
              </p>
            )}
        </div>

        {/* =================================================
           PAYMENT SUCCESS
        ================================================= */}

        {paySuccess && (
          <p className="text-green-600 text-sm mb-4">
            {paySuccess}
          </p>
        )}

        {/* =================================================
           LOADING / ERROR
        ================================================= */}

        {loading && (
          <p className="text-gray-500">
            Loading transactions...
          </p>
        )}

        {!loading && errorMessage && (
          <p className="text-red-500">
            {errorMessage}
          </p>
        )}

        {/* =================================================
           LANDLORD UTILITY BILLS
        ================================================= */}

        {!loading && !errorMessage && (
          <div className="mb-10">
            <h2 className="font-semibold mb-4">
              My Utility Bills
            </h2>

            {landlordBills.length === 0 ? (
              <p className="text-gray-500">
                No bills found under your account.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {landlordBills.map((tx) => {
                  const canPay =
                    tx.status === "pending" &&
                    utilityBillTypes.has(tx.type);

                  const isPaying =
                    payingId === tx.id;

                  return (
                    <div
                      key={tx.id}
                      className="bg-white border border-gray-200 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold capitalize">
                          {tx.type.replace("_", " ")}
                        </h3>

                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            statusStyle[tx.status] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      <p className="text-2xl font-semibold mt-2">
                        $
                        {Number(
                          tx.amount
                        ).toLocaleString()}
                      </p>

                      <p className="text-gray-500 text-sm mt-2">
                        Paid by: {tx.payer_type}
                      </p>

                      <p className="text-gray-400 text-xs mt-3">
                        Created{" "}
                        {new Date(
                          tx.created_at
                        ).toLocaleDateString()}
                        {tx.paid_at
                          ? ` · Paid ${new Date(
                              tx.paid_at
                            ).toLocaleDateString()}`
                          : ""}
                      </p>

                      {payError[tx.id] && (
                        <p className="text-red-500 text-xs mt-2">
                          {payError[tx.id]}
                        </p>
                      )}

                      {canPay && (
                        <button
                          onClick={() =>
                            handlePayUtilityBill(tx.id)
                          }
                          disabled={isPaying}
                          className="mt-4 w-full text-sm px-4 py-2 rounded-lg bg-[#FF5A3D] text-white disabled:opacity-50"
                        >
                          {isPaying
                            ? "Paying..."
                            : "Pay Bill"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =================================================
           ALL TRANSACTIONS
        ================================================= */}

        {!loading && !errorMessage && (
          <div>
            <h2 className="font-semibold mb-4">
              All Property Transactions
            </h2>

            {transactions.length === 0 ? (
              <p className="text-gray-500">
                No transactions found.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white border border-gray-200 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold capitalize">
                        {tx.type.replace("_", " ")}
                      </h3>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusStyle[tx.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <p className="text-2xl font-semibold mt-2">
                      $
                      {Number(tx.amount).toLocaleString()}
                    </p>

                    <p className="text-gray-500 text-sm mt-2">
                      Paid by: {tx.payer_type}
                    </p>

                    {tx.work_order_id && (
                      <p className="text-blue-600 text-sm mt-2">
                        Work Order: #
                        {tx.work_order_id.id}
                      </p>
                    )}

                    <p className="text-gray-400 text-xs mt-3">
                      Created{" "}
                      {new Date(
                        tx.created_at
                      ).toLocaleDateString()}
                      {tx.paid_at
                        ? ` · Paid ${new Date(
                            tx.paid_at
                          ).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}