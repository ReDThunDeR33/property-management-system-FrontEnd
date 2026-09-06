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
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

const reviewSchema = z.object({
  id: z.number(),
  work_order_id: z.number(),
  rating: z.union([z.string(), z.number()]),
  comment: z.string(),
  tenant_id: z.number(),
  created_at: z.string(),
});

const reviewListSchema = z.array(reviewSchema);
type Review = z.infer<typeof reviewSchema>;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
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
        const response = await api.get(`/landlord/reviews/${landlordId}`);
        const result = reviewListSchema.safeParse(response.data);

        if (!result.success) {
          setErrorMessage("Review data came back in an unexpected shape.");
          setLoading(false);
          return;
        }

        setReviews(result.data);
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
            setErrorMessage("Could not load reviews");
          }
        } else {
          setErrorMessage("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• WORK ORDER REVIEWS</p>
          <h1 className="text-3xl font-semibold">Tenant Reviews</h1>
        </div>

        {loading && <p className="text-gray-500">Loading reviews...</p>}
        {!loading && errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {!loading && !errorMessage && reviews.length === 0 && (
          <p className="text-gray-500">No reviews found.</p>
        )}

        {!loading && !errorMessage && reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Work Order #{review.work_order_id}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-600">
                    ★ {review.rating}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">{review.comment}</p>
                <p className="text-gray-400 text-xs mt-3">
                  Tenant #{review.tenant_id} · {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}