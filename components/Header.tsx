import LogoutButton from "../app/staff/LogoutButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
      <h2 className="text-lg font-bold text-gray-900">Staff Panel</h2>
      <LogoutButton />
    </header>
  );
}