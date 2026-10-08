import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

export const PublicFooter = () => {
  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* Main Footer */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <BrandLogo
              size="md"
              showBadge
              badgeText="Retail ERP"
            />

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
              Simple and powerful billing, inventory, and business
              management software built for Indian retailers and
              growing businesses.
            </p>

            {/* Security */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3.5 py-2.5 text-xs font-medium text-orange-700">
              <ShieldCheck className="w-4 h-4" />
              <span>GST Ready • Secure & Reliable</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">
              Product
            </h4>

            <ul className="space-y-3">
              <li>
                <Link
                  to="/features/billing"
                  className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
                >
                  Billing & Invoicing
                </Link>
              </li>

              <li>
                <Link
                  to="/features/inventory"
                  className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
                >
                  Inventory Management
                </Link>
              </li>

              <li>
                <Link
                  to="/features/reports"
                  className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
                >
                  Business Reports
                </Link>
              </li>

              <li>
                <Link
                  to="/pricing"
                  className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">
              Company
            </h4>

            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
                >
                  Contact Us
                </Link>
              </li>

              <li>
                <Link
                  to="/register"
                  className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
                >
                  Start Free
                </Link>
              </li>

              <li>
                <Link
                  to="/login"
                  className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">
              Support
            </h4>

            <ul className="space-y-4">

              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">
                    Email
                  </p>
                  <span className="text-sm text-slate-600">
                    support@vyapix.com
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">
                    Phone
                  </p>
                  <span className="text-sm text-slate-600">
                    +91 98765 43210
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">
                    Location
                  </p>
                  <span className="text-sm text-slate-600">
                    India
                  </span>
                </div>
              </li>

            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-100 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Vyapix. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              to="/privacy"
              className="text-xs text-slate-400 hover:text-orange-600 transition-colors"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms"
              className="text-xs text-slate-400 hover:text-orange-600 transition-colors"
            >
              Terms & Conditions
            </Link>

            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              Built for Indian Businesses
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;

