export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
      {...props}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-2 p-4">
      {/* Header Skeleton */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton
            key={`header-${index}`}
            className="h-4 flex-1"
          />
        ))}
      </div>

      {/* Table Row Skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 border-b border-slate-100 py-2"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>

          {/* Card Content */}
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
