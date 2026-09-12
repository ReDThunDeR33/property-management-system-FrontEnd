"use client"
import { useRouter } from "next/navigation";

export default function LandlordRootPage() {
  const router = useRouter();

  router.push("/landlord/dashboard");
}