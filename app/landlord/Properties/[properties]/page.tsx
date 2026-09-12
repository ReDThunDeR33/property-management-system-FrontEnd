"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../../Components/Layout";
import PropertyImageCarousel from "../../Components/PropertyImageCarousel";
import api from "../../../../lib/axios";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

function getPropertyImages(propertyId: number) {
  return [0, 1, 2].map((offset) => `/${((propertyId + offset) % 6) + 1}.jpg`);
}

const propertyDetailSchema = z.object({
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

type PropertyDetail = z.infer<typeof propertyDetailSchema>;
type ListingStatus = PropertyDetail["listing_status"];
type OccupancyStatus = PropertyDetail["status"];

export default function PropertyDetailPage() {
  const params = useParams<{ properties: string }>();
  const propertyId = Number(params.properties);

  const [landlordId, setLandlordId] = useState<number | null>(null);
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [rentInput, setRentInput] = useState("");
  const [serviceChargeInput, setServiceChargeInput] = useState("");
  const [parkingInput, setParkingInput] = useState("");
  const [listingStatusInput, setListingStatusInput] = useState<ListingStatus>("not_listed");
  const [occupancyInput, setOccupancyInput] = useState<OccupancyStatus>("vacant");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setErrorMessage("");

      if (!propertyId) {
        notFound();
      }

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
        console.error("Error parsing user cookie:", err);
      }

      if (!id) {
        setErrorMessage("Could not find landlord id.");
        setLoading(false);
        return;
      }
      setLandlordId(id);

      let propertyMissing = false;

      try {
        const response = await api.get(`/landlord/properties/${id}/${propertyId}`);

        if (!response.data) {
          propertyMissing = true;
        } else {
          const result = propertyDetailSchema.safeParse(response.data);
          if (!result.success) {
            setErrorMessage("Property data came back in an unexpected shape.");
          } else {
            setProperty(result.data);
            setRentInput(String(result.data.rent_amount));
            setServiceChargeInput(String(result.data.service_charge ?? ""));
            setParkingInput(String(result.data.parking_fee ?? ""));
            setListingStatusInput(result.data.listing_status);
            setOccupancyInput(result.data.status);
          }
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          propertyMissing = true;
        } else if (axios.isAxiosError(error)) {
          const backendMessage = error.response?.data?.message;
          if (Array.isArray(backendMessage)) {
            setErrorMessage(backendMessage[0]);
          } else if (typeof backendMessage === "string") {
            setErrorMessage(backendMessage);
          } else if (!error.response) {
            setErrorMessage("Cannot connect to the backend");
          } else {
            setErrorMessage("Could not load this property");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }

      // called outside the try/catch above on purpose — see the notFound() note
      // at the top of this document
      if (propertyMissing) {
        notFound();
      }
    };

    fetchProperty();
  }, [propertyId]);

  const handleUpdateError = (error: unknown, fallbackMessage: string) => {
    if (axios.isAxiosError(error)) {
      const backendMessage = error.response?.data?.message;
      if (Array.isArray(backendMessage)) {
        setFormError(backendMessage[0]);
      } else if (typeof backendMessage === "string") {
        setFormError(backendMessage);
      } else if (!error.response) {
        setFormError("Cannot connect to the backend");
      } else {
        setFormError(fallbackMessage);
      }
    } else {
      setFormError("Something went wrong");
    }
  };

  const rentSchema = z.coerce.number().positive("Rent must be greater than 0");

  const handleUpdateRent = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const result = rentSchema.safeParse(rentInput);
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }
    if (!landlordId) return;

    try {
      setSavingField("rent");
      const response = await api.patch(
        `/landlord/propety/update/rent/${landlordId}/${propertyId}`,
        { rent_amount: result.data }
      );
      setProperty((prev) => (prev ? { ...prev, rent_amount: response.data.rent_amount } : prev));
      setFormSuccess("Rent updated.");
    } catch (error) {
      handleUpdateError(error, "Could not update rent");
    } finally {
      setSavingField(null);
    }
  };

  const serviceChargeSchema = z.coerce.number().min(0, "Service charge cannot be negative");

  const handleUpdateServiceCharge = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const result = serviceChargeSchema.safeParse(serviceChargeInput);
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }
    if (!landlordId) return;

    try {
      setSavingField("service_charge");
      const response = await api.patch(
        `/landlord/propety/update/service_charge/${landlordId}/${propertyId}`,
        { service_charge: result.data }
      );
      setProperty((prev) => (prev ? { ...prev, service_charge: response.data.service_charge } : prev));
      setFormSuccess("Service charge updated.");
    } catch (error) {
      handleUpdateError(error, "Could not update service charge");
    } finally {
      setSavingField(null);
    }
  };

  const parkingSchema = z.coerce.number().min(0, "Parking fee cannot be negative");

  const handleUpdateParking = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const result = parkingSchema.safeParse(parkingInput);
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }
    if (!landlordId) return;

    try {
      setSavingField("parking");
      // backend expects the body key "parking", not "parking_fee" — see landlord.controller.ts
      const response = await api.patch(
        `/landlord/propety/update/parking/${landlordId}/${propertyId}`,
        { parking: result.data }
      );
      setProperty((prev) => (prev ? { ...prev, parking_fee: response.data.parking_fee } : prev));
      setFormSuccess("Parking fee updated.");
    } catch (error) {
      handleUpdateError(error, "Could not update parking fee");
    } finally {
      setSavingField(null);
    }
  };

  const handleUpdateListingStatus = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!landlordId) return;

    try {
      setSavingField("listing_status");
      const response = await api.patch(
        `/landlord/propety/update/listing_status/${landlordId}/${propertyId}`,
        { listing_status: listingStatusInput }
      );
      setProperty((prev) => (prev ? { ...prev, listing_status: response.data.listing_status } : prev));
      setFormSuccess("Listing status updated.");
    } catch (error) {
      handleUpdateError(error, "Could not update listing status");
    } finally {
      setSavingField(null);
    }
  };

  const handleUpdateOccupancy = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!landlordId) return;

    try {
      setSavingField("status");
      const response = await api.patch(
        `/landlord/propety/update/status/${landlordId}/${propertyId}`,
        { status: occupancyInput }
      );
      setProperty((prev) => (prev ? { ...prev, status: response.data.status } : prev));
      setFormSuccess("Occupancy status updated.");
    } catch (error) {
      handleUpdateError(error, "Could not update occupancy status");
    } finally {
      setSavingField(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-500">Loading property...</p>
      </Layout>
    );
  }

  if (errorMessage) {
    return (
      <Layout>
        <p className="text-red-500">{errorMessage}</p>
      </Layout>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <Layout>
      <section>
        <Link href="/landlord/Properties" className="text-sm text-[#FF5A3D]">
          ← Back to Properties
        </Link>

        <div className="mb-8 mt-4">
          <p className="text-[#FF5A3D] text-sm mb-2">• PROPERTY DETAILS</p>
          <h1 className="text-3xl font-semibold">{property.unit_number}</h1>
          <p className="text-gray-500 mt-2">
            Added by {property.created_by} on {new Date(property.created_at).toLocaleDateString()}
          </p>
        </div>

        <PropertyImageCarousel images={getPropertyImages(property.id)} />

        {formError && <p className="text-red-500 mt-6">{formError}</p>}
        {formSuccess && <p className="text-green-600 mt-6">{formSuccess}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <form onSubmit={handleUpdateRent} className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="text-sm text-gray-500">Rent Amount</label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                step="0.01"
                value={rentInput}
                onChange={(e) => setRentInput(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                type="submit"
                disabled={savingField === "rent"}
                className="bg-[#FF5A3D] text-white px-4 py-2 rounded-lg"
              >
                {savingField === "rent" ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <form onSubmit={handleUpdateServiceCharge} className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="text-sm text-gray-500">Service Charge</label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                step="0.01"
                value={serviceChargeInput}
                onChange={(e) => setServiceChargeInput(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                type="submit"
                disabled={savingField === "service_charge"}
                className="bg-[#FF5A3D] text-white px-4 py-2 rounded-lg"
              >
                {savingField === "service_charge" ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <form onSubmit={handleUpdateParking} className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="text-sm text-gray-500">Parking Fee</label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                step="0.01"
                value={parkingInput}
                onChange={(e) => setParkingInput(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                type="submit"
                disabled={savingField === "parking"}
                className="bg-[#FF5A3D] text-white px-4 py-2 rounded-lg"
              >
                {savingField === "parking" ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <form onSubmit={handleUpdateListingStatus} className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="text-sm text-gray-500">Listing Status</label>
            <div className="flex gap-2 mt-2">
              <select
                value={listingStatusInput}
                onChange={(e) => setListingStatusInput(e.target.value as ListingStatus)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="not_listed">Not Listed</option>
                <option value="for_rent">For Rent</option>
                <option value="for_sale">For Sale</option>
              </select>
              <button
                type="submit"
                disabled={savingField === "listing_status"}
                className="bg-[#FF5A3D] text-white px-4 py-2 rounded-lg"
              >
                {savingField === "listing_status" ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <form onSubmit={handleUpdateOccupancy} className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="text-sm text-gray-500">Occupancy Status</label>
            <div className="flex gap-2 mt-2">
              <select
                value={occupancyInput}
                onChange={(e) => setOccupancyInput(e.target.value as OccupancyStatus)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="sold">Sold</option>
              </select>
              <button
                type="submit"
                disabled={savingField === "status"}
                className="bg-[#FF5A3D] text-white px-4 py-2 rounded-lg"
              >
                {savingField === "status" ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="text-sm text-gray-500">Has Parking</label>
            <p className="mt-2 font-medium">{property.has_parking ? "Yes" : "No"}</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}