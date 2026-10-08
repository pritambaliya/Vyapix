import React from 'react';
import { Link } from 'react-router-dom';

export const BrandLogo = ({
  size = 'md',
  showText = true,
  showBadge = false,
  badgeText = 'Retail ERP',
  className = '',
  to,
}) => {
  const sizes = {
    xs: {
      icon: 'w-6 h-6',
      text: 'text-sm',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    sm: {
      icon: 'w-7 h-7',
      text: 'text-base',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      icon: 'w-9 h-9',
      text: 'text-xl',
      badge: 'text-[10px] px-2 py-0.5',
    },
    lg: {
      icon: 'w-11 h-11',
      text: 'text-2xl',
      badge: 'text-xs px-2 py-0.5',
    },
    xl: {
      icon: 'w-13 h-13',
      text: 'text-3xl',
      badge: 'text-xs px-2.5 py-1',
    },
  };

  const currentSize = sizes[size] || sizes.md;

  const logoContent = (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
    >
      <div
        className={`relative flex items-center justify-center shrink-0 ${currentSize.icon}`}
      >
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <rect
            x="1"
            y="1"
            width="42"
            height="42"
            rx="11"
            fill="#FFF7ED"
            stroke="#FED7AA"
            strokeWidth="1.5"
          />

          {/* Stylized V */}
          <path
            d="M10 12L19.8 31C20.5 32.4 22.5 32.4 23.2 31L34 12"
            stroke="#F97316"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Business growth line */}
          <path
            d="M12 27C17 31.5 23 33 31.5 23"
            stroke="#EA580C"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Arrow */}
          <path
            d="M29 22L32.5 23L31.5 26.5"
            stroke="#EA580C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Accent dot */}
          <circle
            cx="20.5"
            cy="22"
            r="2"
            fill="#FB923C"
          />
        </svg>
      </div>

      {/* Brand Name */}
      {showText && (
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col justify-center">

            <span
              className={`${currentSize.text} font-bold leading-none tracking-[-0.04em] text-slate-900 flex items-baseline`}
              style={{
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <span className="text-orange-600">V</span>
              <span>yapi</span>
              <span className="text-orange-600">x</span>
            </span>

            {/* Small growth underline */}
            <svg
              className="w-full h-1.5 mt-1 overflow-visible"
              viewBox="0 0 60 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4C17 7 39 7 55 2.5"
                stroke="#F97316"
                strokeWidth="1.7"
                strokeLinecap="round"
              />

              <path
                d="M52.5 1.5L55.5 2.5L54.5 5.5"
                stroke="#F97316"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Badge */}
          {showBadge && (
            <span
              className={`
                rounded-md
                font-semibold
                uppercase
                tracking-wide
                bg-orange-50
                text-orange-700
                border
                border-orange-200
                ${currentSize.badge}
              `}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default BrandLogo;
