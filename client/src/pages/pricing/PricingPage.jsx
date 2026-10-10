import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import BrandLogo from '../../Components/common/BrandLogo';

const plans = [
  {
    name: 'Free',
    description: 'For small businesses getting started.',
    price: '0',
    features: [
      'Billing and invoicing',
      'Product management',
      'Basic sales records',
      'Standard support',
    ],
    button: 'Get Started',
    popular: false,
  },
  {
    name: 'Standard',
    description: 'For growing businesses managing daily sales.',
    price: '499',
    features: [
      'Everything in Free',
      'GST billing',
      'Inventory management',
      'Sales reports',
    ],
    button: 'Choose Standard',
    popular: true,
  },
  {
    name: 'Business',
    description: 'For businesses needing more control.',
    price: '999',
    features: [
      'Everything in Standard',
      'Advanced business reports',
      'Enhanced inventory tools',
      'Priority support',
    ],
    button: 'Choose Business',
    popular: false,
  },
];

const PricingPage = () => {
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

      {/* Pricing Heading */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=85')",
          }}
        />

        <div className="absolute inset-0 bg-white/90" />

        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Simple & Transparent
          </p>

          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight sm:text-5xl">
            Plans that fit your <span className="text-orange-500">business.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Whether you're starting small or growing your business, find a plan
            that works for you.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col border bg-white p-7 transition sm:p-8 ${
                plan.popular
                  ? 'border-orange-500 shadow-lg'
                  : 'border-slate-200 hover:border-orange-300'
              }`}
            >
              {plan.popular && (
                <span className="absolute right-0 top-0 bg-orange-500 px-4 py-2 text-xs font-semibold text-white">
                  MOST POPULAR
                </span>
              )}

              <h2 className="text-2xl font-bold">{plan.name}</h2>

              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
                {plan.description}
              </p>

              <div className="mt-7 flex items-end gap-1">
                <span className="text-xl font-semibold">₹</span>

                <span className="font-heading text-5xl font-bold">
                  {plan.price}
                </span>

                <span className="pb-1 text-sm text-slate-500">
                  /month
                </span>
              </div>

              <Link
                to="/register"
                className={`mt-7 flex items-center justify-center gap-2 border px-5 py-3.5 text-sm font-semibold transition ${
                  plan.popular
                    ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600'
                    : 'border-slate-300 text-slate-800 hover:border-orange-500 hover:text-orange-600'
                }`}
              >
                {plan.button}
                <ArrowRight size={17} />
              </Link>

              <div className="my-7 border-t border-slate-200" />

              <h3 className="mb-5 text-sm font-semibold text-slate-900">
                What's included
              </h3>

              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <Check
                      size={18}
                      className="mt-0.5 shrink-0 text-orange-500"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Small Note */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Need help choosing a plan?{' '}
          <Link
            to="/contact"
            className="font-semibold text-orange-600 hover:underline"
          >
            Contact us
          </Link>
        </p>
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

export default PricingPage;