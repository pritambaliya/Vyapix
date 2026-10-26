import React from 'react';
import { Check, Circle } from 'lucide-react';

const getPasswordStrength = (password = '') => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label = '';
  let color = '';
  let barColor = '';
  let width = '0%';

  if (password.length > 0) {
    if (score <= 1) {
      label = 'Very Weak';
      color = 'text-red-600';
      barColor = 'bg-red-500';
      width = '20%';
    } else if (score === 2) {
      label = 'Weak';
      color = 'text-orange-600';
      barColor = 'bg-orange-500';
      width = '40%';
    } else if (score === 3) {
      label = 'Medium';
      color = 'text-yellow-600';
      barColor = 'bg-yellow-500';
      width = '60%';
    } else if (score === 4) {
      label = 'Strong';
      color = 'text-green-600';
      barColor = 'bg-green-500';
      width = '80%';
    } else {
      label = 'Very Strong';
      color = 'text-emerald-700';
      barColor = 'bg-emerald-600';
      width = '100%';
    }
  }

  return { checks, label, color, barColor, width, score };
};

export const isPasswordStrong = (password = '') => {
  const { checks } = getPasswordStrength(password);

  return Object.values(checks).every(Boolean);
};

const PasswordStrength = ({ password = '' }) => {
  if (!password) return null;

  const { checks, label, color, barColor, width } =
    getPasswordStrength(password);

  const requirements = [
    { key: 'length', label: 'At least 8 characters' },
    { key: 'uppercase', label: 'One uppercase letter (A–Z)' },
    { key: 'lowercase', label: 'One lowercase letter (a–z)' },
    { key: 'number', label: 'One number (0–9)' },
    { key: 'special', label: 'One special character (!@#$)' },
  ];

  return (
    <div
      className="mt-2 space-y-3"
      aria-live="polite"
      aria-label="Password strength"
    > 
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          Password strength
        </span>

        <span className={`text-xs font-semibold ${color}`}>
          {label}
        </span>
      </div> 

      <div
        className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={parseInt(width, 10)}
        aria-label={`Password strength: ${label}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width }}
        />
      </div>
 
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {requirements.map(({ key, label: requirement }) => {
          const passed = checks[key];

          return (
            <div
              key={key}
              className={`flex items-center gap-2 text-xs transition-colors ${
                passed ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              {passed ? (
                <Check size={14} className="shrink-0" />
              ) : (
                <Circle size={12} className="shrink-0" />
              )}

              <span>{requirement}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrength;