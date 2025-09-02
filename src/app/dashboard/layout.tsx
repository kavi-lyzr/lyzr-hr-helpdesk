
import AppSidebar from "@/components/app-sidebar";
import SiteHeader from "@/components/site-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Background gradient overlay */}
      <div 
        id="white-gradient" 
        className="white-gradient w-full h-full transition-all duration-300 fixed top-0 left-0 -z-20"
      />
      
      <div className="min-h-screen flex relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <SiteHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
