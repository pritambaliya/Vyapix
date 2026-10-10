import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import PublicLayout from "../Components/layout/PublicLayout";

import AboutUsPage from "../pages/public/AboutUsPage";
import HomePage from "../pages/public/HomePage";
import ContactUsPage from "../pages/public/ContactUsPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import FeatureDetails from "../pages/feature/FeatureDetails";
import SolutionDetails from "../pages/solution/SolutionDetails";
import PricingPage from "../pages/pricing/PricingPage";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={role === "billing" ? "/billing" : "/dashboard"}
        replace
      />
    );
  }

  return children;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <Navigate
        to={role === "billing" ? "/billing" : "/dashboard"}
        replace
      />
    );
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
      </Route>

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

      <Route
        path="/features/:featureName"
        element={<FeatureDetails />}
      />

      <Route
        path="/solutions/:solutionName"
        element={<SolutionDetails />}
      />

      <Route path="/pricing" element={<PricingPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <div>Owner Dashboard</div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRoles={["billing"]}>
            <div>Cashier Billing</div>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;