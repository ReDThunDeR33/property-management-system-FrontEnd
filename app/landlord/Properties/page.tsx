import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../Components/Layout";
import api from "../../../lib/axios";

export const dynamic = "force-dynamic";

const propertySchema = z.object({
  id: z.number(),
  unit_number: z.string(),
  rent_amount: z.union([z.string(), z.number()]),
  service_charge: z.union([z.string(), z.number(), z.null()]).optional(),
  has_parking: z.boolean(),
  parking_fee: z.union([z.string(), z.number(), z.null()]).optional(),
  listing_status: z.enum(["not_listed", "for_rent", "for_sale"]),
  status: z.enum(["vacant", "occupied", "sold"]),
  created_by: z.string(),
  created_at: z.string(),
});

const propertyListSchema = z.array(propertySchema);
type Property = z.infer<typeof propertySchema>;

function getPropertyImage(propertyId: number) {
  return `/${(propertyId % 6) + 1}.jpg`;
}

const listingStatusLabel: Record<string, string> = {
  not_listed: "Not Listed",
  for_rent: "For Rent",
  for_sale: "For Sale",
};

const occupancyStatusLabel: Record<string, string> = {
  vacant: "Vacant",
  occupied: "Occupied",
  sold: "Sold",
};

export default async function PropertiesPage() {
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
  let properties: Property[] = [];

  try {
    const response = await api.get(`/landlord/properties/${landlordId}`);
    const result = propertyListSchema.safeParse(response.data);

    if (!result.success) {
      errorMessage = "Property data came back in an unexpected shape.";
    } else {
      properties = result.data;
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
        errorMessage = "Could not load properties";
      }
    } else {
      errorMessage = "Something went wrong";
    }
  }

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• PROPERTY MANAGEMENT</p>
          <h1 className="text-3xl font-semibold">My Properties</h1>
          <p className="text-gray-500 mt-2">All properties registered under your account.</p>
        </div>

        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {!errorMessage && properties.length === 0 && (
          <p className="text-gray-500">No properties found.</p>
        )}

        {!errorMessage && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/landlord/Properties/${property.id}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#FF5A3D] transition block"
              >
                <div className="w-full h-40 bg-gray-100">
                  <img
                    src={getPropertyImage(property.id)}
                    alt={property.unit_number}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h2 className="font-semibold text-lg">{property.unit_number}</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Rent: ${Number(property.rent_amount).toLocaleString()}/mo
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-[#fff0ed] text-[#FF5A3D]">
                      {listingStatusLabel[property.listing_status]}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {occupancyStatusLabel[property.status]}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}