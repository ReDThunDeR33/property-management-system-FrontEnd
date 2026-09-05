export default function Footer() {
  return (
    <footer className="bg-[#111111] text-gray-400 py-16 px-10 w-full mt-auto flex-shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs mt-6 text-gray-500">
        <p>Copyright © Dwellix | Designed for Staff Management</p>
        <p className="flex items-center gap-2 mt-4 md:mt-0"><span className="w-2 h-2 rounded-full bg-green-500 block"></span> System Status: Online</p>
      </div>
    </footer>
  );
}