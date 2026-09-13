import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

export const dynamic = "force-dynamic";

const propertySchema = z
  .object({
    id: z.number(),
    unit_number: z.string().optional(),
    rent_amount: z.union([z.string(), z.number()]).optional(),
    service_charge: z
      .union([z.string(), z.number(), z.null()])
      .optional(),
    has_parking: z.boolean().optional(),
    parking_fee: z
      .union([z.string(), z.number(), z.null()])
      .optional(),
    listing_status: z.string().optional(),
    status: z.string().optional(),
    created_by: z.string().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

type Property = z.infer<typeof propertySchema>;

export default async function PropertyPage() {
  const cookieStore = await cookies();

  const userCookie = cookieStore.get("user")?.value;
  const accountType = cookieStore.get("account_type")?.value;

  if (accountType !== "tenant") {
    return (
      <Layout>
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
          <div className="text-center text-red-500 font-bold text-lg">
            Unauthorized access. Please log in as tenant.
          </div>
        </div>
      </Layout>
    );
  }

  const token = cookieStore.get("access_token")?.value;

  if (!userCookie || !token) {
    redirect("/login");
  }

  let tenantId: number | null = null;

  try {
    const parsedUser = JSON.parse(
      decodeURIComponent(userCookie)
    );

    if (parsedUser?.account_type !== "tenant") {
      redirect("/login");
    }

    tenantId = parsedUser?.id ?? null;
  } catch (err) {
    console.error("Error parsing user cookie:", err);
  }

  if (!tenantId) {
    return (
      <Layout>
        <p className="text-red-500">
          Could not find tenant id.
        </p>
      </Layout>
    );
  }

  let property: Property | null = null;
  let errorMessage = "";

  try {
    const response = await api.get(
      `/tenant/${tenantId}/property`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = propertySchema.safeParse(
      response.data
    );

    if (!result.success) {
      errorMessage =
        "Property data came back in an unexpected shape.";
    } else {
      property = result.data;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const backendMessage =
        error.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        errorMessage = backendMessage[0];
      } else if (
        typeof backendMessage === "string"
      ) {
        errorMessage = backendMessage;
      } else if (!error.response) {
        errorMessage =
          "Cannot connect to the backend";
      } else {
        errorMessage =
          "Could not load assigned property";
      }
    } else {
      errorMessage = "Something went wrong";
    }
  }

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">
            • PROPERTY
          </p>

          <h1 className="text-3xl font-semibold">
            My Property
          </h1>

          <p className="text-gray-500 mt-2">
            View the property currently assigned to
            your tenant account.
          </p>
        </div>

        {errorMessage && (
          <p className="text-red-500">
            {errorMessage}
          </p>
        )}

        {!errorMessage && property && (
          <div className="max-w-3xl bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">
              {property.unit_number ||
                `Property #${property.id}`}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              <InfoRow
                label="Property ID"
                value={String(property.id)}
              />

              <InfoRow
                label="Unit Number"
                value={
                  property.unit_number || "N/A"
                }
              />

              <InfoRow
                label="Monthly Rent"
                value={
                  property.rent_amount !== undefined
                    ? `৳${Number(
                        property.rent_amount
                      ).toLocaleString()}`
                    : "N/A"
                }
              />

              <InfoRow
                label="Service Charge"
                value={
                  property.service_charge != null
                    ? `৳${Number(
                        property.service_charge
                      ).toLocaleString()}`
                    : "N/A"
                }
              />

              <InfoRow
                label="Parking"
                value={
                  property.has_parking === undefined
                    ? "N/A"
                    : property.has_parking
                    ? "Available"
                    : "Not Available"
                }
              />

              <InfoRow
                label="Parking Fee"
                value={
                  property.parking_fee != null
                    ? `৳${Number(
                        property.parking_fee
                      ).toLocaleString()}`
                    : "N/A"
                }
              />

              <InfoRow
                label="Listing Status"
                value={
                  property.listing_status || "N/A"
                }
              />

              <InfoRow
                label="Occupancy Status"
                value={property.status || "N/A"}
              />
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 py-4 border-b border-gray-100">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-sm font-medium text-right">
        {value}
      </span>
    </div>
  );
}