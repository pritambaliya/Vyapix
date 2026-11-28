import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import PublicLayout from "../Components/layout/PublicLayout";
import AppLayout from "../Components/layout/AppLayout";

import HomePage from "../pages/public/HomePage";
import AboutUsPage from "../pages/public/AboutUsPage";
import ContactUsPage from "../pages/public/ContactUsPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import FeatureDetails from "../pages/feature/FeatureDetails";
import SolutionDetails from "../pages/solution/SolutionDetails";
import PricingPage from "../pages/pricing/PricingPage";

import DashboardPage from "../pages/dashboard/DashboardPage";
import PosBillingPage from "../pages/billing/PosBillingPage";
import ProductsPage from "../pages/products/ProductsPage";
import ProductCreatePage from "../pages/products/ProductCreatePage";
import ArchivedItemsPage from "../pages/products/ArchivedItemsPage";

import InvoiceDetailPage from "../pages/invoices/InvoiceDetailPage";
import InvoicesPage from "../pages/invoices/InvoicesPage";

import SubAccountsPage from "../pages/accounts/SubAccountsPage";
import ActivityPage from "../pages/activity/ActivityPage";
import ProfilePage from "../pages/profile/ProfilePage";


const getHomeRoute = (role) => {
  switch (role) {
    case "owner":
      return "/dashboard";

    case "cashier":
      return "/billing";

    case "billing":
      return "/billing";

    default:
      return "/login";
  }
};


const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF9]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getHomeRoute(role)} replace />;
  }

  return children;
};


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF9]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getHomeRoute(role)} replace />;
  }

  return children;
};


const AppRoutes = () => {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}

      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
      </Route>


      {/* ================= AUTH ROUTES ================= */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />


      {/* ================= OTHER PUBLIC ROUTES ================= */}

      <Route
        path="/features/:featureName"
        element={<FeatureDetails />}
      />

      <Route
        path="/solutions/:solutionName"
        element={<SolutionDetails />}
      />

      <Route path="/pricing" element={<PricingPage />} />


      {/* ================= PROTECTED APP ROUTES ================= */}

      <Route element={<AppLayout />}>

        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />


        {/* BILLING */}

        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={["owner", "cashier"]}>
              <PosBillingPage />
            </ProtectedRoute>
          }
        />


        {/* PRODUCTS LIST */}

        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products/archived"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ArchivedItemsPage />
            </ProtectedRoute>
          }
        />


        {/* ================= PRODUCT CREATION FLOW ================= */}

        <Route
          path="/product/create"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ProductCreatePage />
            </ProtectedRoute>
          }
        />

        {/* Selected Category */}

        <Route
          path="/product/create/:categorySlug"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ProductCreatePage />
            </ProtectedRoute>
          }
        />

        {/* Selected Category + Main Product */}

        <Route
          path="/product/create/:categorySlug/:mainProductSlug"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ProductCreatePage />
            </ProtectedRoute>
          }
        />

        {/* Selected Category + Main Product + Brand Product */}

        <Route
          path="/product/create/:categorySlug/:mainProductSlug/:brandProductSlug"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ProductCreatePage />
            </ProtectedRoute>
          }
        />

        {/* Final Product Details */}

        <Route
          path="/product/details"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ProductCreatePage />
            </ProtectedRoute>
          }
        />


        {/* ================= OTHER APP ROUTES ================= */}

        <Route
          path="/accounts"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <SubAccountsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ActivityPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={["owner", "cashier"]}>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute allowedRoles={["owner", "cashier"]}>
              <InvoiceDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["owner", "cashier"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

      </Route>


      {/* ================= FALLBACK ================= */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
};

export default AppRoutes;