import { Link } from 'react-router-dom';
import {
Mail,
Phone,
MapPin,
ArrowRight,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

export const PublicFooter = () => {
return ( <footer className="border-t border-slate-200 bg-slate-50"> <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

    {/* Main Footer */}
    <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">

      {/* Brand */}
      <div className="lg:col-span-2">
        <BrandLogo
          size="md"
          showBadge
          badgeText="Retail ERP"
        />

        <p className="mt-5 max-w-md font-sans text-sm leading-7 text-slate-600">
          Simple and powerful billing, inventory, and business
          management software built for Indian retailers and
          growing businesses.
        </p>
      </div>

      {/* Product */}
      <div>
        <h4 className="mb-5 font-heading text-sm font-bold text-slate-900">
          Product
        </h4>

        <ul className="space-y-3">
          <li>
            <Link
              to="/features/billing"
              className="font-sans text-sm text-slate-600 transition-colors hover:text-orange-600"
            >
              Billing & Invoicing
            </Link>
          </li>

          <li>
            <Link
              to="/features/inventory"
              className="font-sans text-sm text-slate-600 transition-colors hover:text-orange-600"
            >
              Inventory Management
            </Link>
          </li>

          <li>
            <Link
              to="/features/reports"
              className="font-sans text-sm text-slate-600 transition-colors hover:text-orange-600"
            >
              Business Reports
            </Link>
          </li>

          <li>
            <Link
              to="/pricing"
              className="font-sans text-sm text-slate-600 transition-colors hover:text-orange-600"
            >
              Pricing
            </Link>
          </li>
        </ul>
      </div>

      {/* Company */}
      <div>
        <h4 className="mb-5 font-heading text-sm font-bold text-slate-900">
          Company
        </h4>

        <ul className="space-y-3">
          <li>
            <Link
              to="/about"
              className="font-sans text-sm text-slate-600 transition-colors hover:text-orange-600"
            >
              About Us
            </Link>
          </li>

          <li>
            <Link
              to="/contact"
              className="font-sans text-sm text-slate-600 transition-colors hover:text-orange-600"
            >
              Contact Us
            </Link>
          </li>

          <li>
            <Link
              to="/register"
              className="font-sans text-sm text-slate-600 transition-colors hover:text-orange-600"
            >
              Start Free
            </Link>
          </li>

          <li>
            <Link
              to="/login"
              className="font-sans text-sm text-slate-600 transition-colors hover:text-orange-600"
            >
              Login
            </Link>
          </li>
        </ul>
      </div>

      {/* Support */}
      <div>
        <h4 className="mb-5 font-heading text-sm font-bold text-slate-900">
          Support
        </h4>

        <ul className="space-y-5">

          <li className="flex items-start gap-3">
            <Mail className="mt-1 h-4 w-4 shrink-0 text-orange-500" />

            <div>
              <p className="mb-1 font-sans text-xs text-slate-400">
                Email
              </p>

              <span className="font-sans text-sm text-slate-600">
                support@vyapix.com
              </span>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <Phone className="mt-1 h-4 w-4 shrink-0 text-orange-500" />

            <div>
              <p className="mb-1 font-sans text-xs text-slate-400">
                Phone
              </p>

              <span className="font-sans text-sm text-slate-600">
                +91 98765 43210
              </span>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-orange-500" />

            <div>
              <p className="mb-1 font-sans text-xs text-slate-400">
                Location
              </p>

              <span className="font-sans text-sm text-slate-600">
                India
              </span>
            </div>
          </li>

        </ul>
      </div>

    </div>

    {/* Bottom Footer */}
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 py-6 sm:flex-row">

      <p className="font-sans text-xs text-slate-500">
        © {new Date().getFullYear()} Vyapix. All rights reserved.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-5">

        <Link
          to="/privacy"
          className="font-sans text-xs text-slate-500 transition-colors hover:text-orange-600"
        >
          Privacy Policy
        </Link>

        <Link
          to="/terms"
          className="font-sans text-xs text-slate-500 transition-colors hover:text-orange-600"
        >
          Terms & Conditions
        </Link>

        <span className="hidden items-center gap-1.5 font-sans text-xs text-slate-500 sm:flex">
          Built for Indian Businesses
          <ArrowRight className="h-3.5 w-3.5 text-orange-500" />
        </span>

      </div>

    </div>

  </div>
</footer>


);
};

export default PublicFooter;
