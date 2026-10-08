import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import ToastContainer from '../common/ToastContainer';

export const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-150">
      <PublicNavbar />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <PublicFooter />
      <ToastContainer />
    </div>
  );
};

export default PublicLayout;
