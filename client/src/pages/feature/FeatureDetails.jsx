import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import BrandLogo from '../../Components/common/BrandLogo';

const features = {
  billing: {
    title: 'Billing & Invoicing',
    description:
      'Create professional invoices, manage sales, and keep your business billing organised in one place.',
    benefits: [
      'Create invoices easily',
      'Manage products and prices',
      'Print professional bills',
    ],
  },

  inventory: {
    title: 'Inventory Management',
    description:
      'Manage your products, keep track of stock, and organise your inventory without unnecessary effort.',
    benefits: [
      'Manage your products',
      'Update stock information',
      'Keep product details organised',
    ],
  },

  gst: {
    title: 'GST Billing',
    description:
      'Create invoices with GST details and manage your billing information with ease.',
    benefits: [
      'Add GST details to invoices',
      'Manage product information',
      'Keep billing records organised',
    ],
  },

  reports: {
    title: 'Business Reports',
    description:
      'Keep your business records organised and review your sales and billing information whenever needed.',
    benefits: [
      'Review sales information',
      'Track billing records',
      'Keep business data organised',
    ],
  },
};

const FeatureDetails = () => {
  const { featureName } = useParams();
  const feature = features[featureName];

  if (!feature) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link to="/" className="text-orange-600 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <BrandLogo />

          <div className="flex items-center gap-5">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-orange-600"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=85')",
          }}
        />

        {/* Light overlay */}
        <div className="absolute inset-0 bg-white/90" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          {/* Left Content */}
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-orange-600">
              Vyapix Business Solutions
            </p>

            <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {feature.title}
              <span className="text-orange-500"> made simple.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              {feature.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-orange-500 px-6 py-4 font-semibold text-white transition hover:bg-orange-600"
              >
                Get Started <ArrowRight size={18} />
              </Link>

              <Link
                to="/login"
                className="border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-800 transition hover:border-orange-400 hover:text-orange-600"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Right Benefits Card */}
          <div className="border border-slate-200 bg-white/95 p-7 shadow-lg sm:p-9">
            <h2 className="mb-7 text-2xl font-bold">
              What you can do
            </h2>

            <div className="space-y-6">
              {feature.benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-4">
                  <CheckCircle2
                    size={22}
                    className="shrink-0 text-orange-500"
                  />

                  <p className="text-base text-slate-700">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-sm leading-6 text-slate-500">
                Manage your everyday business tasks with Vyapix.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Vyapix. All rights reserved.</p>

          <div className="flex gap-5">
            <Link to="/about" className="hover:text-orange-600">
              About
            </Link>

            <Link to="/contact" className="hover:text-orange-600">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeatureDetails;