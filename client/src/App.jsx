import { BrowserRouter } from 'react-router-dom';

import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

import AppRoutes from './routes/AppRoutes';

import CookieConsent from './Components/common/CookieConsent';
import ScrollToTop from './Components/common/ScrollToTop';

import ConfirmDialog from './Components/common/ConfirmDialog';
import ToastContainer from './Components/common/ToastContainer';

import { HelmetProvider } from 'react-helmet-async';

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
        <ToastContainer />
        <ConfirmDialog />

      </ToastProvider>
    </HelmetProvider>
  );
}

export default App;