import { Outlet, Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { MobileHeader } from "./MobileHeader";

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">טוען...</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground font-sans antialiased"
      dir="rtl"
    >
      {/* Desktop Sidebar */}
      <AppSidebar className="fixed inset-y-0 right-0 z-50 hidden md:flex" />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <div className="flex min-h-screen flex-col md:mr-64">
        {/* Desktop Header - Hide on mobile if MobileHeader handles it, or keep it for user actions? 
              Usually Desktop Header has Breadcrumbs or shared actions. 
              The current Header in code is imported but not analyzed deeply. 
              Let's keep it but check if it duplicates visual. 
              The MobileHeader has the Logo/Title. The Desktop Header likely has other things.
              Let's hide Desktop Header on Mobile or adapt it.
              For now, assume Header is for Desktop-like top bar.
          */}
        <div className="hidden md:block">
          <Header />
        </div>

        <main className="flex-1 p-4 md:px-8 md:py-8 md:mt-16 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
