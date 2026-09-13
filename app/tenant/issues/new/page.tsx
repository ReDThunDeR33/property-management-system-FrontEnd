"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import Layout from "../../Components/Layout";
import api from "../../../../lib/axios";

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

const issueFormSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .min(5, "Description must be at least 5 characters"),

  image_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value ||
        z.string().url().safeParse(value).success,
      "Please enter a valid image URL"
    ),

  property: z
    .number()
    .min(1, "Property ID is required"),
});

type FormErrors = {
  description?: string;
  image_url?: string;
  property?: string;
  general?: string;
};

export default function ReportIssuePage() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [propertyId, setPropertyId] = useState("");

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrors({});

    const result = issueFormSchema.safeParse({
      description,
      image_url: imageUrl,
      property: Number(propertyId),
    });

    if (!result.success) {
      const fieldErrors =
        result.error.flatten().fieldErrors;

      setErrors({
        description:
          fieldErrors.description?.[0],
        image_url:
          fieldErrors.image_url?.[0],
        property:
          fieldErrors.property?.[0],
      });

      return;
    }

    const userData = getCookie("user");

    if (!userData) {
      setErrors({
        general: "You are not logged in.",
      });

      return;
    }

    let tenantId: number | null = null;

    try {
      tenantId =
        JSON.parse(userData)?.id ?? null;
    } catch (err) {
      console.error(
        "Error parsing user cookie:",
        err
      );
    }

    if (!tenantId) {
      setErrors({
        general:
          "Could not find tenant id.",
      });

      return;
    }

    setLoading(true);

    try {
      await api.post(
        `/tenant/${tenantId}/issues`,
        {
          description:
            result.data.description,

          image_url:
            result.data.image_url ||
            undefined,

          property:
            result.data.property,
        }
      );

      router.push("/tenant/issues");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message;

        if (
          Array.isArray(
            backendMessage
          )
        ) {
          setErrors({
            general:
              backendMessage[0],
          });
        } else if (
          typeof backendMessage ===
          "string"
        ) {
          setErrors({
            general:
              backendMessage,
          });
        } else if (
          !error.response
        ) {
          setErrors({
            general:
              "Cannot connect to the backend",
          });
        } else {
          setErrors({
            general:
              "Could not report issue",
          });
        }
      } else {
        setErrors({
          general:
            "Something went wrong",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">
            • ISSUE TRACKING
          </p>

          <h1 className="text-3xl font-semibold">
            Report Issue
          </h1>

          <p className="text-gray-500 mt-2">
            Report a maintenance problem for
            your assigned property.
          </p>
        </div>

        <div className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6">
          {errors.general && (
            <p className="text-red-500 mb-5">
              {errors.general}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Issue Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={6}
                placeholder="Describe the maintenance issue..."
                className={`w-full border rounded-lg px-4 py-3 outline-none resize-none ${
                  errors.description
                    ? "border-red-400"
                    : "border-gray-300 focus:border-[#FF5A3D]"
                }`}
              />

              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="property"
                className="block text-sm font-medium mb-2"
              >
                Property ID
              </label>

              <input
                id="property"
                type="number"
                value={propertyId}
                onChange={(event) =>
                  setPropertyId(
                    event.target.value
                  )
                }
                placeholder="Enter property ID"
                className={`w-full border rounded-lg px-4 py-3 outline-none ${
                  errors.property
                    ? "border-red-400"
                    : "border-gray-300 focus:border-[#FF5A3D]"
                }`}
              />

              {errors.property && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.property}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="image_url"
                className="block text-sm font-medium mb-2"
              >
                Image URL{" "}
                <span className="text-gray-400 font-normal">
                  (Optional)
                </span>
              </label>

              <input
                id="image_url"
                type="text"
                value={imageUrl}
                onChange={(event) =>
                  setImageUrl(
                    event.target.value
                  )
                }
                placeholder="https://example.com/image.jpg"
                className={`w-full border rounded-lg px-4 py-3 outline-none ${
                  errors.image_url
                    ? "border-red-400"
                    : "border-gray-300 focus:border-[#FF5A3D]"
                }`}
              />

              {errors.image_url && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.image_url}
                </p>
              )}
            </div>

            {imageUrl && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Image Preview
                </p>

                <div className="w-full h-52 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Issue preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/tenant/issues"
                  )
                }
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#FF5A3D] text-white rounded-lg hover:bg-[#e94e34] transition disabled:opacity-60"
              >
                {loading
                  ? "Submitting..."
                  : "Submit Issue"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}