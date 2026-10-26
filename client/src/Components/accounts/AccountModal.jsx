import React, { useState } from 'react';
import { User, Lock, Info, CreditCard, Store } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

export const AccountModal = ({
  isOpen,
  onClose,
  onCreateAccount,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    employeeName: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Counter or terminal name is required.';
    }

    if (!formData.password || formData.password.length < 4) {
      errs.password = 'Password must be at least 4 characters.';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading || !validate()) return;

    onCreateAccount({
      name: formData.name.trim(),
      employeeName: formData.employeeName.trim() || undefined,
      password: formData.password,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Billing Account"
      subtitle="Set up a separate login for your cashier or billing counter."
      maxWidth="max-w-lg"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={loading}
          >
            Create Account
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Counter information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Store size={19} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Counter Details
              </h3>
              <p className="text-xs text-slate-500">
                Identify the billing terminal.
              </p>
            </div>
          </div>

          <Input
            label="Counter / Terminal Name"
            name="name"
            placeholder="e.g. Counter 1, Ground Floor POS"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            autoComplete="off"
          />

          <Input
            label="Assigned Cashier / Employee"
            name="employeeName"
            placeholder="e.g. Ravi Kumar"
            icon={User}
            value={formData.employeeName}
            onChange={handleChange}
            autoComplete="off"
          />

          <p className="-mt-2 text-xs text-slate-500">
            Optional — assign a cashier to make counter management easier.
          </p>
        </div>

        {/* Login credentials */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Lock size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Login Credentials
              </h3>
              <p className="text-xs text-slate-500">
                Create a password for this account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Cashier Password"
              name="password"
              type="password"
              placeholder="Minimum 4 characters"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              icon={Lock}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            Use a unique password for this cashier account. Avoid sharing
            passwords between employees.
          </p>
        </div>

        {/* Billing code information */}
        <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm ring-1 ring-orange-100">
              <CreditCard size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-800">
                Automatic Account Setup
              </h4>

              <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Vyapix will automatically assign a unique billing code and
                account number when the account is created.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-orange-100 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-orange-700">
                  VXP-XXXXXX
                </span>

                <span className="text-xs text-slate-500">
                  Example billing code
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
          <Info
            size={16}
            className="mt-0.5 shrink-0 text-slate-500"
          />

          <p className="text-xs leading-relaxed text-slate-600">
            The billing code and account number are generated by your
            existing account creation process. This form does not generate
            them locally.
          </p>
        </div>

        {/* Submit button for keyboard users */}
        <button type="submit" className="hidden" disabled={loading}>
          Create Account
        </button>
      </form>
    </Modal>
  );
};

export default AccountModal; 
