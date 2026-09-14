"use client";

import { useEffect, useState, FormEvent } from "react";
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
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(
      parts.pop()?.split(";").shift() || ""
    );
  }

  return null;
}

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

  payer_type: z.enum([
    "landlord",
    "tenant",
  ]),

  status: z.string(),

  created_by_type: z.string(),

  created_at: z.string(),

  paid_at: z
    .string()
    .nullable(),

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
   DUPLICATE PROTECTION
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
   TENANT
========================================================= */

const tenantSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const tenantListSchema =
  z.array(tenantSchema);

type Tenant = z.infer<
  typeof tenantSchema
>;

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
   STATUS
========================================================= */

const statusStyle: Record<
  string,
  string
> = {
  paid:
    "bg-green-50 text-green-600",

  pending:
    "bg-yellow-50 text-yellow-600",

  rejected:
    "bg-red-50 text-red-600",
};

/* =========================================================
   UTILITY TYPES
========================================================= */

const utilityBillTypes = new Set([
  "electricity",
  "water",
  "gas",
  "service_charge",
  "parking",
]);

type TransactionType =
  | "electricity"
  | "water"
  | "gas"
  | "service_charge"
  | "parking";

/* =========================================================
   PAGE
========================================================= */

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [landlordId, setLandlordId] =
    useState<number | null>(null);

  /* =======================================================
     WORK ORDERS
  ======================================================= */

  const [workOrders, setWorkOrders] =
    useState<WorkOrder[]>([]);

  const [
    workOrdersLoading,
    setWorkOrdersLoading,
  ] = useState(true);

  const [
    workOrdersError,
    setWorkOrdersError,
  ] = useState("");

  const [
    selectedWorkOrderId,
    setSelectedWorkOrderId,
  ] = useState("");

  const [
    creatingWorkOrderPayment,
    setCreatingWorkOrderPayment,
  ] = useState(false);

  const [
    workOrderCreateError,
    setWorkOrderCreateError,
  ] = useState("");

  const [
    workOrderCreateSuccess,
    setWorkOrderCreateSuccess,
  ] = useState("");

  /* =======================================================
     CREATE TRANSACTION
  ======================================================= */

  const [
    transactionType,
    setTransactionType,
  ] = useState<TransactionType>(
    "electricity",
  );

  const [
    transactionAmount,
    setTransactionAmount,
  ] = useState("");

  const [
    transactionPropertyId,
    setTransactionPropertyId,
  ] = useState("");

  const [
    creatingTransaction,
    setCreatingTransaction,
  ] = useState(false);

  const [
    transactionCreateError,
    setTransactionCreateError,
  ] = useState("");

  const [
    transactionCreateSuccess,
    setTransactionCreateSuccess,
  ] = useState("");

  /* =======================================================
     PROPERTIES
  ======================================================= */

  const [properties, setProperties] =
    useState<
      {
        id: number;
        unit_number?:
          | string
          | number
          | null;
      }[]
    >([]);

  const [
    propertiesLoading,
    setPropertiesLoading,
  ] = useState(true);

  const [
    propertiesError,
    setPropertiesError,
  ] = useState("");

  /* =======================================================
     PAY UTILITY BILL
  ======================================================= */

  const [payingId, setPayingId] =
    useState<number | null>(null);

  const [payError, setPayError] =
    useState<Record<number, string>>(
      {},
    );

  const [paySuccess, setPaySuccess] =
    useState("");

  /* =======================================================
     TENANTS
  ======================================================= */

  const [tenants, setTenants] =
    useState<Tenant[]>([]);

  const [
    tenantsLoading,
    setTenantsLoading,
  ] = useState(true);

  const [
    tenantsError,
    setTenantsError,
  ] = useState("");

  const [
    selectedTenantId,
    setSelectedTenantId,
  ] = useState("");

  const [
    tenantTransactions,
    setTenantTransactions,
  ] = useState<Transaction[]>([]);

  const [
    tenantTxLoading,
    setTenantTxLoading,
  ] = useState(false);

  const [
    tenantTxError,
    setTenantTxError,
  ] = useState("");

  const [
    hasSearchedTenant,
    setHasSearchedTenant,
  ] = useState(false);

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
        setWorkOrdersLoading(false);
        setTenantsLoading(false);
        setPropertiesLoading(false);

        return;
      }

      let currentLandlordId:
        | number
        | null = null;

      try {
        currentLandlordId =
          JSON.parse(
            userData,
          )?.id ?? null;
      } catch (error) {
        console.error(
          "Error parsing user cookie:",
          error,
        );
      }

      if (!currentLandlordId) {
        setErrorMessage(
          "Could not find landlord id.",
        );

        setLoading(false);
        setWorkOrdersLoading(false);
        setTenantsLoading(false);
        setPropertiesLoading(false);

        return;
      }

      setLandlordId(
        currentLandlordId,
      );

      /* ===================================================
         TRANSACTIONS
      =================================================== */

      try {
        const response =
          await api.get(
            `/landlord/transactions/${currentLandlordId}`,
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
            "Transaction data came back in an unexpected shape.",
          );
        } else {
          setTransactions(
            removeDuplicateTransactions(
              result.data,
            ),
          );
        }
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
              "Could not load transactions.",
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

      /* ===================================================
         WORK ORDERS
      =================================================== */

      try {
        const response =
          await api.get(
            `/landlord/workorders/${currentLandlordId}`,
          );

        const result =
          workOrderListSchema.safeParse(
            response.data,
          );

        if (!result.success) {
          setWorkOrdersError(
            "Work order data came back in an unexpected shape.",
          );
        } else {
          setWorkOrders(
            result.data,
          );
        }
      } catch (error) {
        console.error(error);

        setWorkOrdersError(
          "Could not load work orders.",
        );
      } finally {
        setWorkOrdersLoading(false);
      }

      /* ===================================================
         PROPERTIES
      =================================================== */

      try {
        const response =
          await api.get(
            `/landlord/properties/${currentLandlordId}`,
          );

        const propertySchema =
          z.array(
            z.object({
              id: z.number(),

              unit_number: z
                .union([
                  z.string(),
                  z.number(),
                ])
                .nullable()
                .optional(),
            }),
          );

        const result =
          propertySchema.safeParse(
            response.data,
          );

        if (!result.success) {
          setPropertiesError(
            "Property data came back in an unexpected shape.",
          );
        } else {
          setProperties(
            result.data,
          );
        }
      } catch (error) {
        console.error(error);

        setPropertiesError(
          "Could not load properties.",
        );
      } finally {
        setPropertiesLoading(false);
      }

      /* ===================================================
         TENANTS
      =================================================== */

      try {
        const response =
          await api.get(
            `/landlord/tenants/${currentLandlordId}`,
          );

        const result =
          tenantListSchema.safeParse(
            response.data,
          );

        if (!result.success) {
          setTenantsError(
            "Tenant data came back in an unexpected shape.",
          );
        } else {
          setTenants(
            result.data,
          );
        }
      } catch (error) {
        console.error(error);

        setTenantsError(
          "Could not load tenants.",
        );
      } finally {
        setTenantsLoading(false);
      }
    };

    fetchData();
  }, []);

  /* =======================================================
     CREATE TRANSACTION
  ======================================================= */

  const handleCreateTransaction =
    async (
      e: FormEvent,
    ) => {
      e.preventDefault();

      if (!landlordId) {
        setTransactionCreateError(
          "Landlord ID not found.",
        );
        return;
      }

      const amount =
        Number(
          transactionAmount,
        );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        setTransactionCreateError(
          "Amount must be greater than 0.",
        );
        return;
      }

      if (
        !transactionPropertyId
      ) {
        setTransactionCreateError(
          "Please select a property.",
        );
        return;
      }

      setCreatingTransaction(
        true,
      );

      setTransactionCreateError(
        "",
      );

      setTransactionCreateSuccess(
        "",
      );

      try {
        const response =
          await api.post(
            `/landlord/transaction/${landlordId}`,
            {
              type:
                transactionType,

              amount,

              property_id:
                Number(
                  transactionPropertyId,
                ),

              /*
               * IMPORTANT
               */
              payer_type:
                "landlord",
            },
          );

        const result =
          transactionSchema.safeParse(
            response.data,
          );

        if (!result.success) {
          console.error(
            result.error,
          );

          setTransactionCreateError(
            "Transaction was created but returned invalid data.",
          );

          return;
        }

        setTransactions(
          (previous) =>
            removeDuplicateTransactions(
              [
                result.data,
                ...previous,
              ],
            ),
        );

        setTransactionCreateSuccess(
          `Transaction #${result.data.id} created successfully.`,
        );

        setTransactionType(
          "electricity",
        );

        setTransactionAmount(
          "",
        );

        setTransactionPropertyId(
          "",
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
            setTransactionCreateError(
              message[0],
            );
          } else if (
            typeof message ===
            "string"
          ) {
            setTransactionCreateError(
              message,
            );
          } else {
            setTransactionCreateError(
              "Could not create transaction.",
            );
          }
        } else {
          setTransactionCreateError(
            "Something went wrong.",
          );
        }
      } finally {
        setCreatingTransaction(
          false,
        );
      }
    };

  /* =======================================================
     CREATE WORK ORDER PAYMENT
  ======================================================= */

  const handleCreateWorkOrderTransaction =
    async (
      e: FormEvent,
    ) => {
      e.preventDefault();

      if (
        !landlordId ||
        !selectedWorkOrderId
      ) {
        return;
      }

      setCreatingWorkOrderPayment(
        true,
      );

      setWorkOrderCreateError(
        "",
      );

      setWorkOrderCreateSuccess(
        "",
      );

      try {
        const workOrderId =
          Number(
            selectedWorkOrderId,
          );

        await api.post(
          `/landlord/work-order/transaction/${landlordId}/${workOrderId}`,
        );

        /*
         * IMPORTANT:
         * Load the transaction list again from
         * the database.
         *
         * This makes the transaction survive
         * page refreshes and ensures the UI uses
         * the real saved transaction.
         */

        const transactionResponse =
          await api.get(
            `/landlord/transactions/${landlordId}`,
          );

        const transactionResult =
          transactionListSchema.safeParse(
            transactionResponse.data,
          );

        if (
          !transactionResult.success
        ) {
          console.error(
            transactionResult.error,
          );

          setWorkOrderCreateError(
            "Payment was created but transactions could not be refreshed.",
          );

          return;
        }

        setTransactions(
          removeDuplicateTransactions(
            transactionResult.data,
          ),
        );

        setWorkOrderCreateSuccess(
          `Payment transaction created for Work Order #${workOrderId}.`,
        );

        setSelectedWorkOrderId(
          "",
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
            setWorkOrderCreateError(
              message[0],
            );
          } else if (
            typeof message ===
            "string"
          ) {
            setWorkOrderCreateError(
              message,
            );
          } else {
            setWorkOrderCreateError(
              "Could not create work order payment.",
            );
          }
        } else {
          setWorkOrderCreateError(
            "Something went wrong.",
          );
        }
      } finally {
        setCreatingWorkOrderPayment(
          false,
        );
      }
    };

  /* =======================================================
     PAY UTILITY BILL
  ======================================================= */

  const handlePayUtilityBill =
    async (
      transactionId: number,
    ) => {
      if (!landlordId) {
        return;
      }

      setPayingId(
        transactionId,
      );

      setPaySuccess("");

      setPayError(
        (previous) => ({
          ...previous,

          [transactionId]: "",
        }),
      );

      try {
        const response =
          await api.patch(
            `/landlord/utility-bill/pay/${landlordId}/${transactionId}`,
            {},
          );

        const result =
          transactionSchema.safeParse(
            response.data,
          );

        if (result.success) {
          setTransactions(
            (previous) =>
              removeDuplicateTransactions(
                previous.map(
                  (
                    transaction,
                  ) =>
                    transaction.id ===
                    transactionId
                      ? result.data
                      : transaction,
                ),
              ),
          );
        } else {
          const refreshed =
            await api.get(
              `/landlord/transactions/${landlordId}`,
            );

          const refreshedResult =
            transactionListSchema.safeParse(
              refreshed.data,
            );

          if (
            refreshedResult.success
          ) {
            setTransactions(
              removeDuplicateTransactions(
                refreshedResult.data,
              ),
            );
          }
        }

        setPaySuccess(
          `Bill #${transactionId} paid successfully.`,
        );
      } catch (error) {
        let message =
          "Could not pay this bill.";

        if (
          axios.isAxiosError(error)
        ) {
          const backendMessage =
            error.response?.data
              ?.message;

          if (
            Array.isArray(
              backendMessage,
            )
          ) {
            message =
              backendMessage[0];
          } else if (
            typeof backendMessage ===
            "string"
          ) {
            message =
              backendMessage;
          }
        }

        setPayError(
          (previous) => ({
            ...previous,

            [transactionId]:
              message,
          }),
        );
      } finally {
        setPayingId(
          null,
        );
      }
    };

  /* =======================================================
     TENANT TRANSACTIONS
  ======================================================= */

  const handleLoadTenantTransactions =
    async (
      e: FormEvent,
    ) => {
      e.preventDefault();

      if (
        !landlordId ||
        !selectedTenantId
      ) {
        return;
      }

      setTenantTxLoading(
        true,
      );

      setTenantTxError("");

      setTenantTransactions(
        []);

      setHasSearchedTenant(
        true,
      );

      try {
        const response =
          await api.get(
            `/landlord/tenant/transactions/${landlordId}/${selectedTenantId}`,
          );

        const result =
          transactionListSchema.safeParse(
            response.data,
          );

        if (!result.success) {
          setTenantTxError(
            "Transaction data came back in an unexpected shape.",
          );

          return;
        }

        setTenantTransactions(
          removeDuplicateTransactions(
            result.data,
          ),
        );
      } catch (error) {
        console.error(error);

        setTenantTxError(
          "Could not load tenant transactions.",
        );
      } finally {
        setTenantTxLoading(
          false,
        );
      }
    };

  /* =======================================================
     LANDLORD BILLS
  ======================================================= */

  const landlordBills =
    transactions.filter(
      (transaction) =>
        transaction.payer_type ===
        "landlord",
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
            • FINANCIAL OVERVIEW
          </p>

          <h1 className="text-3xl font-semibold">
            Transactions
          </h1>

          <p className="text-gray-500 mt-2">
            Rent, service charges,
            parking, utility bills,
            and work order costs.
          </p>

        </div>

        {/* =================================================
           CREATE TRANSACTION
        ================================================= */}

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">

          <h2 className="text-lg font-semibold">
            Create Transaction
          </h2>

          <p className="text-gray-500 text-sm mt-1 mb-5">
            Create a utility transaction
            for one of your properties.
          </p>

          <form
            onSubmit={
              handleCreateTransaction
            }
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >

            <div>

              <label className="text-sm text-gray-500 block mb-1">
                Transaction Type
              </label>

              <select
                value={
                  transactionType
                }
                onChange={(e) =>
                  setTransactionType(
                    e.target
                      .value as TransactionType,
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >

                <option value="electricity">
                  Electricity
                </option>

                <option value="water">
                  Water
                </option>

                <option value="gas">
                  Gas
                </option>

                <option value="service_charge">
                  Service Charge
                </option>

                <option value="parking">
                  Parking
                </option>

              </select>

            </div>

            <div>

              <label className="text-sm text-gray-500 block mb-1">
                Amount
              </label>

              <input
                type="number"
                min="1"
                step="0.01"
                value={
                  transactionAmount
                }
                onChange={(e) =>
                  setTransactionAmount(
                    e.target.value,
                  )
                }
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />

            </div>

            <div>

              <label className="text-sm text-gray-500 block mb-1">
                Property
              </label>

              {propertiesLoading ? (

                <p className="text-sm text-gray-500 py-2">
                  Loading properties...
                </p>

              ) : (

                <select
                  value={
                    transactionPropertyId
                  }
                  onChange={(e) =>
                    setTransactionPropertyId(
                      e.target.value,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >

                  <option value="">
                    Select property
                  </option>

                  {properties.map(
                    (property) => (
                      <option
                        key={`property-${property.id}`}
                        value={
                          property.id
                        }
                      >
                        Property #
                        {
                          property.id
                        }

                        {property.unit_number
                          ? ` - Unit ${property.unit_number}`
                          : ""}
                      </option>
                    ),
                  )}

                </select>

              )}

            </div>

            <div className="md:col-span-3 bg-gray-50 rounded-lg p-4">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">

                <div>

                  <p className="text-gray-500">
                    Payer Type
                  </p>

                  <p className="font-medium text-blue-600 mt-1">
                    Landlord
                  </p>

                </div>

                <div>

                  <p className="text-gray-500">
                    Initial Status
                  </p>

                  <p className="font-medium mt-1">
                    Pending
                  </p>

                </div>

                <div>

                  <p className="text-gray-500">
                    Created By
                  </p>

                  <p className="font-medium mt-1">
                    Landlord
                  </p>

                </div>

              </div>

            </div>

            <div className="md:col-span-3">

              <button
                type="submit"
                disabled={
                  creatingTransaction
                }
                className="bg-[#FF5A3D] text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {creatingTransaction
                  ? "Creating..."
                  : "Create Transaction"}
              </button>

            </div>

          </form>

          {transactionCreateError && (
            <p className="text-red-500 text-sm mt-4">
              {
                transactionCreateError
              }
            </p>
          )}

          {transactionCreateSuccess && (
            <p className="text-green-600 text-sm mt-4">
              {
                transactionCreateSuccess
              }
            </p>
          )}

        </div>

        {/* =================================================
           WORK ORDER PAYMENT
        ================================================= */}

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">

          <h2 className="text-lg font-semibold">
            Create Work Order Payment
          </h2>

          <p className="text-gray-500 text-sm mt-1 mb-5">
            Create a pending payment
            transaction for the selected
            work order.
          </p>

          <form
            onSubmit={
              handleCreateWorkOrderTransaction
            }
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
                  value={
                    selectedWorkOrderId
                  }
                  onChange={(e) =>
                    setSelectedWorkOrderId(
                      e.target.value,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >

                  <option value="">
                    Select a work order
                  </option>

                  {workOrders.map(
                    (workOrder) => {

                      const total =
                        Number(
                          workOrder.labor_cost ??
                            0,
                        ) +
                        Number(
                          workOrder.materials_cost ??
                            0,
                        ) +
                        Number(
                          workOrder.additional_cost ??
                            0,
                        );

                      return (
                        <option
                          key={`work-order-${workOrder.id}`}
                          value={
                            workOrder.id
                          }
                          disabled={
                            total <= 0
                          }
                        >
                          Work Order #
                          {
                            workOrder.id
                          }
                          {" — "}
                          {
                            workOrder.status
                          }
                          {" — $"}
                          {
                            total.toLocaleString()
                          }
                        </option>
                      );
                    },
                  )}

                </select>

              )}

            </div>

            <button
              type="submit"
              disabled={
                creatingWorkOrderPayment ||
                !selectedWorkOrderId
              }
              className="bg-[#FF5A3D] text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >

              {creatingWorkOrderPayment
                ? "Creating..."
                : "Create Payment"}

            </button>

          </form>

          {workOrderCreateError && (
            <p className="text-red-500 text-sm mt-4">
              {
                workOrderCreateError
              }
            </p>
          )}

          {workOrderCreateSuccess && (
            <p className="text-green-600 text-sm mt-4">
              {
                workOrderCreateSuccess
              }
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
            View transactions for a
            specific tenant.
          </p>

          <form
            onSubmit={
              handleLoadTenantTransactions
            }
            className="flex flex-col sm:flex-row gap-3 items-end"
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
                  value={
                    selectedTenantId
                  }
                  onChange={(e) =>
                    setSelectedTenantId(
                      e.target.value,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >

                  <option value="">
                    Select a tenant
                  </option>

                  {tenants.map(
                    (tenant) => (
                      <option
                        key={`tenant-${tenant.id}`}
                        value={
                          tenant.id
                        }
                      >
                        {
                          tenant.name
                        }
                        {" (#"}
                        {tenant.id}
                        {")"}
                      </option>
                    ),
                  )}

                </select>

              )}

            </div>

            <button
              type="submit"
              disabled={
                !selectedTenantId ||
                tenantTxLoading
              }
              className="bg-[#FF5A3D] text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
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
            tenantTransactions.length >
              0 && (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">

              {tenantTransactions.map(
                (tx) => (
                  <div
                    key={`tenant-tx-${tx.id}`}
                    className="border border-gray-200 rounded-lg p-4"
                  >

                    <div className="flex items-center justify-between">

                      <h4 className="font-medium capitalize text-sm">
                        {
                          tx.type
                            .replace(
                              "_",
                              " ",
                            )
                        }
                      </h4>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusStyle[
                            tx.status
                          ] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {
                          tx.status
                        }
                      </span>

                    </div>

                    <p className="text-xl font-semibold mt-2">
                      $
                      {Number(
                        tx.amount,
                      ).toLocaleString()}
                    </p>

                    <p className="text-gray-500 text-xs mt-1">
                      Payer Type:{" "}
                      {
                        tx.payer_type
                      }
                    </p>

                    <p className="text-gray-400 text-xs mt-2">
                      Created{" "}
                      {new Date(
                        tx.created_at,
                      ).toLocaleDateString()}
                    </p>

                  </div>
                ),
              )}

            </div>
          )}

          {!tenantTxLoading &&
            !tenantTxError &&
            hasSearchedTenant &&
            tenantTransactions.length ===
              0 && (
            <p className="text-gray-500 text-sm mt-4">
              No transactions found
              for this tenant.
            </p>
          )}

        </div>

        {/* =================================================
           UTILITY BILLS
        ================================================= */}

        {!loading &&
          !errorMessage && (

          <div className="mb-10">

            <h2 className="font-semibold mb-4">
              My Utility Bills
            </h2>

            {landlordBills.length ===
            0 ? (

              <p className="text-gray-500">
                No bills found under
                your account.
              </p>

            ) : (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {landlordBills.map(
                  (tx) => {

                    const canPay =
                      tx.status ===
                        "pending" &&
                      utilityBillTypes.has(
                        tx.type,
                      );

                    const isPaying =
                      payingId ===
                      tx.id;

                    return (

                      <div
                        key={`bill-${tx.id}`}
                        className="bg-white border border-gray-200 rounded-xl p-6"
                      >

                        <div className="flex items-center justify-between">

                          <h3 className="font-semibold capitalize">
                            {
                              tx.type.replace(
                                "_",
                                " ",
                              )
                            }
                          </h3>

                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              statusStyle[
                                tx.status
                              ] ??
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {
                              tx.status
                            }
                          </span>

                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Transaction #
                          {tx.id}
                        </p>

                        <p className="text-2xl font-semibold mt-2">
                          $
                          {Number(
                            tx.amount,
                          ).toLocaleString()}
                        </p>

                        <p className="text-gray-500 text-sm mt-2">
                          Payer Type:{" "}
                          {
                            tx.payer_type
                          }
                        </p>

                        <p className="text-gray-500 text-sm mt-1">
                          Created By:{" "}
                          {
                            tx.created_by_type
                          }
                        </p>

                        {tx.work_order_id && (
                          <p className="text-blue-600 text-sm mt-2">
                            Work Order: #
                            {
                              tx
                                .work_order_id
                                .id
                            }
                          </p>
                        )}

                        {payError[
                          tx.id
                        ] && (
                          <p className="text-red-500 text-xs mt-2">
                            {
                              payError[
                                tx.id
                              ]
                            }
                          </p>
                        )}

                        {canPay && (
                          <button
                            onClick={() =>
                              handlePayUtilityBill(
                                tx.id,
                              )
                            }
                            disabled={
                              isPaying
                            }
                            className="mt-4 w-full bg-[#FF5A3D] text-white text-sm py-2 rounded-lg disabled:opacity-50"
                          >
                            {isPaying
                              ? "Paying..."
                              : "Pay Bill"}
                          </button>
                        )}

                        {tx.status ===
                          "paid" && (
                          <div className="mt-4 w-full text-center bg-green-50 text-green-600 text-sm py-2 rounded-lg">
                            Payment Completed
                          </div>
                        )}

                      </div>
                    );
                  },
                )}

              </div>
            )}

          </div>
        )}

        {/* =================================================
           ALL TRANSACTIONS
        ================================================= */}

        {!loading &&
          !errorMessage && (

          <div>

            <h2 className="font-semibold mb-4">
              All Property Transactions
            </h2>

            {transactions.length ===
            0 ? (

              <p className="text-gray-500">
                No transactions found.
              </p>

            ) : (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {transactions.map(
                  (tx) => (

                    <div
                      key={`all-tx-${tx.id}`}
                      className="bg-white border border-gray-200 rounded-xl p-6"
                    >

                      <div className="flex items-center justify-between">

                        <h3 className="font-semibold capitalize">
                          {
                            tx.type.replace(
                              "_",
                              " ",
                            )
                          }
                        </h3>

                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            statusStyle[
                              tx.status
                            ] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {
                            tx.status
                          }
                        </span>

                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Transaction #
                        {tx.id}
                      </p>

                      <p className="text-2xl font-semibold mt-2">
                        $
                        {Number(
                          tx.amount,
                        ).toLocaleString()}
                      </p>

                      <p className="text-gray-500 text-sm mt-2">
                        Payer Type:{" "}
                        {
                          tx.payer_type
                        }
                      </p>

                      <p className="text-gray-500 text-sm mt-1">
                        Created By:{" "}
                        {
                          tx.created_by_type
                        }
                      </p>

                      {tx.work_order_id && (
                        <p className="text-blue-600 text-sm mt-2">
                          Work Order: #
                          {
                            tx
                              .work_order_id
                              .id
                          }
                        </p>
                      )}

                      <p className="text-gray-400 text-xs mt-3">
                        Created{" "}
                        {new Date(
                          tx.created_at,
                        ).toLocaleDateString()}

                        {tx.paid_at
                          ? ` · Paid ${new Date(
                              tx.paid_at,
                            ).toLocaleDateString()}`
                          : ""}
                      </p>

                    </div>

                  ),
                )}

              </div>
            )}

          </div>
        )}

      </section>
    </Layout>
  );
}