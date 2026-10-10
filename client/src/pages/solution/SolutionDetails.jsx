import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import BrandLogo from '../../Components/common/BrandLogo';

const solutions = {
  retail: {
    title: 'Retail Stores',
    description:
      'Manage your store, handle daily sales, create bills, and keep your products organised with Vyapix.',
    benefits: [
      'Create bills quickly',
      'Manage products and stock',
      'Keep track of daily sales',
    ],
  },

  wholesale: {
    title: 'Wholesale Business',
    description:
      'Simplify wholesale billing, manage product quantities, and organise your business transactions in one place.',
    benefits: [
      'Manage bulk product sales',
      'Create professional invoices',
      'Organise customer and billing details',
    ],
  },

  business: {
    title: 'Small Business',
    description:
      'Make everyday business management easier with simple billing, organised products, and accessible business records.',
    benefits: [
      'Manage everyday billing',
      'Organise products and prices',
      'Keep business records in one place',
    ],
  },
};

const SolutionDetails = () => {
  const { solutionName } = useParams();
  const solution = solutions[solutionName];

  if (!solution) {
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

        <div className="absolute inset-0 bg-white/90" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          {/* Left Content */}
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-orange-600">
              Vyapix Business Solutions
            </p>

            <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {solution.title}
              <span className="text-orange-500"> made simple.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              {solution.description}
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
              How Vyapix helps
            </h2>

            <div className="space-y-6">
              {solution.benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-4">
                  <CheckCircle2
                    size={22}
                    className="shrink-0 text-orange-500"
                  />

                  <p className="text-base text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-sm leading-6 text-slate-500">
                Simple tools to help you manage your business with Vyapix.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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

export default SolutionDetails;