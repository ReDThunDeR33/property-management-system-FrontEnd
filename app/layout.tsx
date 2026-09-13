import "./globals.css";
import TenantNotifications from "@/components/TenantNotifications";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TenantNotifications />
        {children}
        
      </body>
    </html>
  );
}