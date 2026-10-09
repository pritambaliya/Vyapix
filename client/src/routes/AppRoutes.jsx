import { Routes, Route } from "react-router-dom";
import PublicLayout from "../Components/layout/PublicLayout";
import AboutUsPage from "../pages/public/AboutUsPage";
import HomePage from "../pages/public/HomePage";
import ContactUsPage from "../pages/public/ContactUsPage";

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="/contact" element={<ContactUsPage />} />
            </Route>
        </Routes>
    )
}

export default AppRoutes;