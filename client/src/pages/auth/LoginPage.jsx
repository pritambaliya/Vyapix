import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Input from '../../Components/common/Input';
import Button from '../../Components/common/Button';
import BrandLogo from '../../Components/common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('owner');

  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const [billingCode, setBillingCode] = useState('');
  const [billingPassword, setBillingPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { loginOwner, loginBilling } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();

    const errs = {};

    if (!ownerEmail.trim()) {
      errs.ownerEmail = 'Email address is required';
    }

    if (!ownerPassword) {
      errs.ownerPassword = 'Password is required';
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await loginOwner(ownerEmail.trim(), ownerPassword);

      if (res.success) {
        success('Welcome back, Store Owner!');
        navigate('/dashboard');
      }
    } catch (err) {
      const message =
        err.message || 'Login failed. Please check your credentials.';

      error(message);
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const handleBillingSubmit = async (e) => {
    e.preventDefault();

    const errs = {};

    if (!billingCode.trim()) {
      errs.billingCode = 'Billing Code is required';
    }

    if (!billingPassword) {
      errs.billingPassword = 'Password is required';
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await loginBilling(
        billingCode.trim(),
        billingPassword
      );

      if (res.success) {
        success('Billing session started successfully!');
        navigate('/billing');
      }
    } catch (err) {
      const message =
        err.message ||
        'Login failed. Please check your billing code and password.';

      error(message);
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-white font-sans">
 
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rotate-12 border border-orange-100 bg-orange-50/40" />

        <div className="absolute -right-20 -top-24 h-80 w-80 -rotate-12 border border-slate-100 bg-slate-50/50" />

        <div className="absolute -bottom-28 right-[15%] h-72 w-72 rotate-12 border border-orange-100/70" />
      </div>
 
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" aria-label="Vyapix home">
          <BrandLogo size="md" showBadge badgeText="ERP" />
        </Link>

        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-orange-600"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </header>

      {/* Main content */}
      <section className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">

        {/* Combined rectangular container */}
        <div className="login-container-enter grid w-full max-w-5xl grid-cols-1 overflow-hidden border border-slate-200 bg-white shadow-[0_12px_50px_rgba(15,23,42,0.07)] md:grid-cols-[0.85fr_1.15fr]">

          {/* Left promotional section */}
          <div className="relative flex flex-col justify-center overflow-hidden border-b border-slate-200 bg-orange-50/60 p-6 sm:p-8 md:border-b-0 md:border-r lg:p-10">

            <div className="relative z-10">

              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                Business made simple
              </p>

              <h1 className="font-heading text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                Everything your business needs,
                <span className="block text-orange-600">
                  in one place.
                </span>
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
                Create invoices, manage inventory, and track sales with
                simple tools designed for your daily business operations.
              </p>

              {/* Small promotional image */}
              <div className="mt-6 overflow-hidden border border-slate-200 bg-white">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80"
                  alt="Retail business owner handling a customer transaction"
                  className="h-40 w-full object-cover sm:h-48"
                />
              </div>

              {/* Key benefits */}
              <div className="mt-5 space-y-3">
                {[
                  'Fast and simple billing',
                  'GST invoice management',
                  'Inventory and sales tracking',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 text-sm text-slate-700"
                  >
                    <CheckCircle2
                      size={17}
                      className="shrink-0 text-orange-600"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right login section */}
          <div className="flex items-center justify-center p-6 sm:p-9 lg:p-12">

            <div className="w-full max-w-md">

              <div className="mb-7">
                <h2 className="font-heading text-2xl font-bold text-slate-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to access your Vyapix workspace.
                </p>
              </div>

              {/* Role tabs */}
              <div className="mb-6 grid grid-cols-2 border border-slate-200 bg-white">

                <button
                  type="button"
                  onClick={() => changeTab('owner')}
                  className={`border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                    activeTab === 'owner'
                      ? 'border-orange-500 bg-orange-50/60 text-orange-700'
                      : 'border-transparent text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Store Owner
                </button>

                <button
                  type="button"
                  onClick={() => changeTab('billing')}
                  className={`border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                    activeTab === 'billing'
                      ? 'border-orange-500 bg-orange-50/60 text-orange-700'
                      : 'border-transparent text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cashier
                </button>

              </div>

              {/* Error message */}
              {errors.form && (
                <div className="mb-5 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                  {errors.form}
                </div>
              )}

              {/* Owner login form */}
              {activeTab === 'owner' ? (
                <form
                  onSubmit={handleOwnerSubmit}
                  className="login-form-enter space-y-5"
                >

                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    icon={Mail}
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    error={errors.ownerEmail}
                    required
                    autoFocus
                  />

                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    icon={Lock}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    error={errors.ownerPassword}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="mt-2 w-full !rounded-none"
                    loading={loading}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Sign In
                  </Button>

                  <p className="pt-1 text-center text-sm text-slate-600">
                    New to Vyapix?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-orange-600 hover:underline"
                    >
                      Create an account
                    </Link>
                  </p>

                </form>
              ) : (
                /* Cashier login form */
                <form
                  onSubmit={handleBillingSubmit}
                  className="login-form-enter space-y-5"
                >

                  <Input
                    label="Billing Code"
                    name="billingCode"
                    placeholder="e.g. VXP-XXXXXX"
                    icon={KeyRound}
                    value={billingCode}
                    onChange={(e) =>
                      setBillingCode(e.target.value.toUpperCase())
                    }
                    error={errors.billingCode}
                    helperText="Get your billing code from the store owner."
                    required
                    autoFocus
                  />

                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    icon={Lock}
                    value={billingPassword}
                    onChange={(e) => setBillingPassword(e.target.value)}
                    error={errors.billingPassword}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="mt-2 w-full !rounded-none"
                    loading={loading}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Start Billing
                  </Button>

                  <p className="pt-1 text-center text-sm text-slate-600">
                    Need access? Contact your store owner.
                  </p>

                </form>
              )}

              {/* Footer links */}
              <div className="mt-7 flex items-center justify-center gap-5 border-t border-slate-200 pt-5 text-xs text-slate-500">

                <Link
                  to="/about"
                  className="hover:text-orange-600"
                >
                  About Vyapix
                </Link>

                <span className="h-1 w-1 bg-slate-300" />

                <Link
                  to="/contact"
                  className="hover:text-orange-600"
                >
                  Help & Support
                </Link>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Bottom text */}
      <footer className="relative z-10 px-4 pb-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Vyapix. Simple billing. Smarter business.
      </footer>

      {/* Animations and input styling */}
      <style>{`
        @keyframes loginContainerEnter {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loginFormEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-container-enter {
          animation: loginContainerEnter 0.55s ease-out both;
        }

        .login-form-enter {
          animation: loginFormEnter 0.35s ease-out both;
        }

        /* White inputs, black text and placeholders */
        .login-container-enter input,
        .login-container-enter textarea,
        .login-container-enter select {
          background-color: #ffffff !important;
          color: #111827 !important;
          border-color: #d1d5db !important;
          border-radius: 0 !important;
        }

        .login-container-enter input::placeholder,
        .login-container-enter textarea::placeholder {
          color: #111827 !important;
          opacity: 1;
        }

        .login-container-enter input:focus,
        .login-container-enter textarea:focus,
        .login-container-enter select:focus {
          border-color: #f97316 !important;
          outline: 2px solid rgba(249, 115, 22, 0.12);
          outline-offset: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .login-container-enter,
          .login-form-enter {
            animation: none;
          }
        }
      `}</style>

    </main>
  );
};

export default LoginPage;