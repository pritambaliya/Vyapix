import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Upload,
  X,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

import Input from '../../Components/common/Input';
import Button from '../../Components/common/Button';
import BrandLogo from '../../Components/common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    shopName: '',
    shopPhone: '',
    address: '',
    gstNumber: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { registerOwner } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logo: 'Logo file size must be less than 2MB',
      }));
      e.target.value = '';
      return;
    }

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));

    setErrors((prev) => ({
      ...prev,
      logo: '',
    }));
  };

  const handleRemoveLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(null);
    setLogoPreview(null);
    setErrors((prev) => ({
      ...prev,
      logo: '',
    }));
  };

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    }

    if (!formData.password || formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!formData.shopName.trim()) {
      errs.shopName = 'Store name is required';
    }

    if (!formData.shopPhone.trim()) {
      errs.shopPhone = 'Store contact phone is required';
    }

    if (!formData.address.trim()) {
      errs.address = 'Store address is required';
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const data = new FormData();

      data.append('name', formData.name.trim());
      data.append('email', formData.email.trim().toLowerCase());
      data.append('phone', formData.phone.trim());
      data.append('password', formData.password);
      data.append('shopName', formData.shopName.trim());
      data.append('shopPhone', formData.shopPhone.trim());
      data.append('address', formData.address.trim());

      if (formData.gstNumber.trim()) {
        data.append(
          'gstNumber',
          formData.gstNumber.trim().toUpperCase()
        );
      }

      if (logoFile) {
        data.append('logo', logoFile);
      }

      const res = await registerOwner(data);

      if (res.success) {
        success('Store registered successfully! Welcome to Vyapix.');
        navigate('/dashboard');
      }
    } catch (err) {
      const message =
        err.message || 'Registration failed. Please check your inputs.';

      error(message);
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-white font-sans">

      {/* Background rectangles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rotate-12 border border-orange-100 bg-orange-50/40" />

        <div className="absolute -right-20 -top-24 h-80 w-80 -rotate-12 border border-slate-100 bg-slate-50/50" />

        <div className="absolute -bottom-28 right-[15%] h-72 w-72 rotate-12 border border-orange-100/70" />
      </div>

      {/* Header */}
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
        <div className="register-container-enter grid w-full max-w-6xl grid-cols-1 overflow-hidden border border-slate-200 bg-white shadow-[0_12px_50px_rgba(15,23,42,0.07)] lg:grid-cols-[0.75fr_1.25fr]">

          {/* Left promotional section */}
          <aside className="relative flex flex-col justify-center overflow-hidden border-b border-slate-200 bg-orange-50/60 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-9">

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              Get started with Vyapix
            </p>

            <h1 className="font-heading text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              Your business,
              <span className="block text-orange-600">
                better organised.
              </span>
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Create your store account and manage billing, inventory,
              and sales from one convenient workspace.
            </p>

            {/* Promotional image */}
            <div className="mt-6 overflow-hidden border border-slate-200 bg-white">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80"
                alt="Retail business owner serving a customer"
                className="h-40 w-full object-cover sm:h-48"
              />
            </div>

            {/* Benefits */}
            <div className="mt-6 space-y-3">
              {[
                'Set up your store profile',
                'Create GST-ready invoices',
                'Track stock and sales',
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

            <p className="mt-7 border-t border-orange-200/70 pt-4 text-xs leading-5 text-slate-500">
              Start with your store details and customise your business
              profile as you grow.
            </p>
          </aside>

          {/* Right registration section */}
          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">

            <div className="w-full max-w-2xl">

              {/* Heading */}
              <div className="mb-6">
                <h2 className="font-heading text-2xl font-bold text-slate-900">
                  Create your store account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your details to get your business started.
                </p>
              </div>

              {/* Form error */}
              {errors.form && (
                <div className="mb-5 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                  {errors.form}
                </div>
              )}

              <form onSubmit={handleSubmit} className="register-form-enter space-y-6">

                {/* Owner information */}
                <section>
                  <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <User size={17} className="text-orange-600" />

                    <h3 className="text-sm font-semibold text-slate-800">
                      Owner Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <Input
                      label="Full Name"
                      name="name"
                      placeholder="Enter your full name"
                      icon={User}
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      required
                    />

                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      icon={Mail}
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                    />

                    <Input
                      label="Mobile Number"
                      name="phone"
                      type="tel"
                      placeholder="Enter mobile number"
                      icon={Phone}
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                    />

                    <Input
                      label="Account Password"
                      name="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      icon={Lock}
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      required
                    />

                  </div>
                </section>

                {/* Store information */}
                <section>
                  <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Store size={17} className="text-orange-600" />

                    <h3 className="text-sm font-semibold text-slate-800">
                      Store Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <Input
                      label="Store / Business Name"
                      name="shopName"
                      placeholder="Enter your store name"
                      icon={Store}
                      value={formData.shopName}
                      onChange={handleChange}
                      error={errors.shopName}
                      required
                    />

                    <Input
                      label="Store Contact Number"
                      name="shopPhone"
                      type="tel"
                      placeholder="Enter store phone number"
                      icon={Phone}
                      value={formData.shopPhone}
                      onChange={handleChange}
                      error={errors.shopPhone}
                      required
                    />

                  </div>

                  <div className="mt-4">
                    <Input
                      label="Store Address"
                      name="address"
                      placeholder="Enter your complete store address"
                      icon={MapPin}
                      value={formData.address}
                      onChange={handleChange}
                      error={errors.address}
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <Input
                      label="GSTIN / GST Number"
                      name="gstNumber"
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      helperText="Add your GSTIN to include it in your store profile."
                      required
                    />
                  </div>
                </section>

                {/* Store logo */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Upload size={16} className="text-orange-600" />

                    <label className="text-sm font-semibold text-slate-800">
                      Store Logo
                      <span className="ml-1 font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-4">

                    {logoPreview ? (
                      <div className="relative h-16 w-16 shrink-0 border border-slate-200 bg-white">
                        <img
                          src={logoPreview}
                          alt="Store logo preview"
                          className="h-full w-full object-contain p-1"
                        />

                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center border border-slate-200 bg-white text-slate-600 hover:text-red-600"
                          aria-label="Remove store logo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center border border-dashed border-slate-300 bg-white text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-600">
                        <Upload size={20} />

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    <div className="min-w-0 text-xs leading-5 text-slate-500">
                      <p>Upload your business logo.</p>
                      <p>PNG, JPG, SVG or WEBP · Maximum 2MB</p>

                      {errors.logo && (
                        <p className="mt-1 text-red-600">
                          {errors.logo}
                        </p>
                      )}
                    </div>

                  </div>
                </section>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="!rounded-none w-full"
                  loading={loading}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Create Store Account
                </Button>

              </form>

              {/* Sign in link */}
              <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-orange-600 hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>

              {/* Footer links */}
              <div className="mt-4 flex items-center justify-center gap-5 text-xs text-slate-500">
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
        @keyframes registerContainerEnter {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes registerFormEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .register-container-enter {
          animation: registerContainerEnter 0.55s ease-out both;
        }

        .register-form-enter {
          animation: registerFormEnter 0.4s ease-out both;
        }

        /* White inputs, black text, light borders */
        .register-container-enter input,
        .register-container-enter textarea,
        .register-container-enter select {
          background-color: #ffffff !important;
          color: #111827 !important;
          border-color: #d1d5db !important;
          border-radius: 0 !important;
        }

        .register-container-enter input::placeholder,
        .register-container-enter textarea::placeholder {
          color: #111827 !important;
          opacity: 1;
        }

        .register-container-enter input:focus,
        .register-container-enter textarea:focus,
        .register-container-enter select:focus {
          border-color: #f97316 !important;
          outline: 2px solid rgba(249, 115, 22, 0.12);
          outline-offset: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .register-container-enter,
          .register-form-enter {
            animation: none;
          }
        }
      `}</style>

    </main>
  );
};

export default RegisterPage;