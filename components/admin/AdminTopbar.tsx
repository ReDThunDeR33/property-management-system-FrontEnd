/* ============================================================
   ADMIN TOPBAR (Server Component — no interactivity needed)
   ------------------------------------------------------------
   Course concepts demonstrated here:
   • A plain (server) component rendered inside the admin layout.
   • PROPS: the layout passes the logged-in admin's data down to
     this component, so the topbar can greet the user by name.
     This is the "pass data from parent to child with props"
     concept from the course (Task2 header.tsx does the same).
   • Visual design follows Admin-FIXED.html: white topbar with a
     page title, search field placeholder and an admin chip.
   ============================================================ */

type AdminTopbarProps = {
  adminName: string;
  adminEmail: string;
  pageTitle: string;
};

export default function AdminTopbar({
  adminName,
  adminEmail,
  pageTitle,
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-base-300 bg-white px-6 py-4">
      {/* Left: current page title (comes from the layout via props) */}
      <h2 className="text-lg font-bold text-base-content">{pageTitle}</h2>

      {/* Right: admin identity chip */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight">{adminName}</p>
          <p className="text-xs text-gray-500">{adminEmail}</p>
        </div>
        <div className="avatar placeholder">
          <div className="w-10 rounded-full bg-dwellix-500 text-white">
            {/* First letter of the admin's name as the avatar */}
            <span className="text-lg font-bold">{adminName.charAt(0)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
