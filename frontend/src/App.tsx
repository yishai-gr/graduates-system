import { Suspense, lazy } from "react";
import { LazyMotion, domMax } from "framer-motion";
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconLoader } from "@tabler/icons-react";
import { TooltipProvider } from "@/components/ui/tooltip";

// Lazy load pages
const LoginPage = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const GraduatesPage = lazy(() => import("@/pages/GraduatesPage"));
const UnauthorizedPage = lazy(() => import("@/pages/Unauthorized"));
const GraduateFormPage = lazy(
  () => import("@/pages/graduates/GraduateFormPage"),
);
const GraduateViewPage = lazy(
  () => import("@/pages/graduates/GraduateViewPage"),
);
const UserFormPage = lazy(() => import("@/pages/users/UserFormPage"));
const UserViewPage = lazy(() => import("@/pages/users/UserViewPage"));
const ChangePasswordPage = lazy(() => import("@/pages/ChangePasswordPage"));
// Loading component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-background">
    <div className="flex flex-col items-center gap-4">
      <IconLoader className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-lg">טוען...</p>
    </div>
  </div>
);

function App() {
  return (
    <LazyMotion features={domMax}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/users/new" element={<UserFormPage />} />
                  <Route path="/users/:id" element={<UserViewPage />} />
                  <Route path="/users/:id/edit" element={<UserFormPage />} />
                  <Route
                    path="/users/:id/password"
                    element={<ChangePasswordPage />}
                  />

                  <Route path="/graduates" element={<GraduatesPage />} />
                  <Route path="/graduates/new" element={<GraduateFormPage />} />
                  <Route path="/graduates/:id" element={<GraduateViewPage />} />
                  <Route
                    path="/graduates/:id/edit"
                    element={<GraduateFormPage />}
                  />

                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  {/* Fallback */}
                  <Route path="*" element={<div>404 - עמוד לא נמצא</div>} />
                </Route>
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </LazyMotion>
  );
}

export default App;
