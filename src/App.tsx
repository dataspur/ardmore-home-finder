import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/layout/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import Rentals from "./pages/Rentals";
import ForSale from "./pages/ForSale";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import ResidentPortal from "./pages/ResidentPortal";
import TenantPay from "./pages/TenantPay";
import PaymentSuccess from "./pages/PaymentSuccess";
import TenantPaymentSuccess from "./pages/TenantPaymentSuccess";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import AdminResetPassword from "./pages/AdminResetPassword";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import Messages from "./pages/admin/Messages";
import Tenants from "./pages/admin/Tenants";
import Properties from "./pages/admin/Properties";
import Leases from "./pages/admin/Leases";
import Payments from "./pages/admin/Payments";
import Settings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/for-sale" element={<ForSale />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/pay/:token" element={<TenantPay />} />
          <Route path="/pay/:token/success" element={<TenantPaymentSuccess />} />
          <Route path="/success" element={<PaymentSuccess />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-reset-password" element={<AdminResetPassword />} />
          <Route
            path="/resident-portal"
            element={
              <ProtectedRoute>
                <ResidentPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="messages" element={<Messages />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="properties" element={<Properties />} />
            <Route path="leases" element={<Leases />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
