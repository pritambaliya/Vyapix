import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from "./routes/AppRoutes";
import CookieConsent from './Components/common/CookieConsent';
import { HelmetProvider } from 'react-helmet-async';
import ScrollToTop from './Components/common/ScrollToTop';

function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
            <CookieConsent />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
      </HelmetProvider>
  );
}

export default App;