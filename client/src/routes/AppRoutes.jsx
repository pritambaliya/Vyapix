import { Routes, Route } from "react-router-dom";
import PublicLayout from "../Components/layout/PublicLayout";
import AboutUsPage from "../pages/public/AboutUsPage";
import HomePage from "../pages/public/HomePage";
import ContactUsPage from "../pages/public/ContactUsPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={role === 'billing' ? '/billing' : '/dashboard'} replace />;
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
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/register" element={<RegisterPage />}/>
            
        </Routes>
    )
}

export default AppRoutes;