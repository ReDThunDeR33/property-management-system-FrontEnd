import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";



export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto w-full flex flex-col bg-gray-50">
          <div className="p-10 max-w-7xl mx-auto w-full flex-grow">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}