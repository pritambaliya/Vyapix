import React, { useEffect, useState } from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  UserRound,
  Info,
} from 'lucide-react';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const INITIAL_FORM_DATA = {
  ownerPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  onResetPassword,
  account,
  loading = false,
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  }, [account?._id]);

  const handleClose = () => {
    if (loading) return;

    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];

      if (
        name === 'newPassword' &&
        updated.confirmPassword &&
        value === formData.confirmPassword
      ) {
        delete updated.confirmPassword;
      }

      if (
        name === 'confirmPassword' &&
        value === formData.newPassword
      ) {
        delete updated.confirmPassword;
      }

      return updated;
    });
  };

  const validate = () => {
    const errs = {};

    if (!formData.ownerPassword) {
      errs.ownerPassword = 'Store owner password is required.';
    }

    if (!formData.newPassword) {
      errs.newPassword = 'Please enter a new cashier password.';
    } else if (formData.newPassword.length < 4) {
      errs.newPassword = 'Password must be at least 4 characters.';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm the new password.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading || !account || !validate()) return;

    onResetPassword({
      accountId: account._id,
      ownerPassword: formData.ownerPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });
  };

  if (!isOpen || !account) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Cashier Password"
      subtitle="Update the login credentials for this billing account."
      maxWidth="max-w-lg"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            Reset Password
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Account information */}
        <div className="flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-orange-100">
            <UserRound size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">
              Billing Account
            </p>

            <h3 className="mt-1 break-words text-sm font-semibold text-slate-900">
              {account.name}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">
                Account Number:
              </span>

              <span className="break-all rounded-md border border-orange-100 bg-white px-2 py-1 font-mono text-xs font-medium text-orange-700">
                {account.accountNumber || 'Not available'}
              </span>
            </div>
          </div>
        </div>

        {/* Owner verification */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Owner Verification
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Verify your authority before making changes.
              </p>
            </div>
          </div>

          <Input
            label="Store Owner Password"
            name="ownerPassword"
            type="password"
            placeholder="Enter your owner password"
            icon={ShieldCheck}
            value={formData.ownerPassword}
            onChange={handleChange}
            error={errors.ownerPassword}
            helperText="Your password authorizes this account update."
            required
            autoComplete="current-password"
          />
        </section>

        {/* New password */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
              <KeyRound size={19} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                New Login Credentials
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Create a new password for the cashier.
              </p>
            </div>
          </div>

          <Input
            label="New Cashier Password"
            name="newPassword"
            type="password"
            placeholder="Enter new password"
            icon={Lock}
            value={formData.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />
        </section>

        {/* Security information */}
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <Info
            size={17}
            className="mt-0.5 shrink-0 text-slate-500"
          />

          <div>
            <p className="text-xs font-semibold text-slate-700">
              Security Reminder
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Choose a password that is difficult to guess. The new password
              will take effect only after the server successfully processes
              the reset request.
            </p>
          </div>
        </div>

        {/* Keyboard form submission */}
        <button
          type="submit"
          disabled={loading}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        >
          Reset Password
        </button>
      </form>
    </Modal>
  );
};

export default ResetPasswordModal; 
