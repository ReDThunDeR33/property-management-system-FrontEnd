"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setErrorMessage("");

      const userData = getCookie("user");
      if (!userData) {
        setErrorMessage("You are not logged in.");
        setLoading(false);
        return;
      }

      let landlordId: number | null = null;
      try {
        landlordId = JSON.parse(userData)?.id ?? null;
      } catch (err) {
        console.error("Error parsing user cookie:", err);
      }

      if (!landlordId) {
        setErrorMessage("Could not find landlord id.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/landlord/properties/${landlordId}`);
        const result = propertyListSchema.safeParse(response.data);

        if (!result.success) {
          setErrorMessage("Property data came back in an unexpected shape.");
          setLoading(false);
          return;
        }

        setProperties(result.data);
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
            setErrorMessage("Could not load properties");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• PROPERTY MANAGEMENT</p>
          <h1 className="text-3xl font-semibold">My Properties</h1>
          <p className="text-gray-500 mt-2">All properties registered under your account.</p>
        </div>

        {loading && <p className="text-gray-500">Loading properties...</p>}
        {!loading && errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {!loading && !errorMessage && properties.length === 0 && (
          <p className="text-gray-500">No properties found.</p>
        )}

        {!loading && !errorMessage && properties.length > 0 && (
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