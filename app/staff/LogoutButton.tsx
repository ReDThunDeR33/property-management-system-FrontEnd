"use client";

import { useRouter } from "next/navigation";

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
}

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // Destroy every authentication cookie
    deleteCookie("access_token");
    deleteCookie("account_type");
    deleteCookie("user");

    // Go back to login
    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
    >
      Logout
    </button>
  );
}