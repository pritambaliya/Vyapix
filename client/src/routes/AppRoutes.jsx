import { Routes, Route } from "react-router-dom";
import PublicLayout from "../Components/layout/PublicLayout";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<PublicLayout />}></Route>
        </Routes>
    )
}

export default AppRoutes;