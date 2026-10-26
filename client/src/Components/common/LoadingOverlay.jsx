const LoadingOverlay = ({
  loading = false,
  title = "Signing you in",
  message = "Please wait while we securely access your account...",
  brand = "VYAPIX",
}) => {
  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-orange-100" />

          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-500" />

          <div className="h-7 w-7 rounded-full bg-orange-500" />
        </div>

        {/* Loading Message */}
        <div className="text-center">
          <p className="text-base font-semibold text-slate-900">
            {title}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {message}
          </p>
        </div>

        {/* Brand */}
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
          {brand}
        </span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
