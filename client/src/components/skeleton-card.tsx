export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg animate-pulse">
      <div className="aspect-[1.6/1] bg-gray-200 dark:bg-gray-800" />

      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function PropertyCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
      ))}
    </div>
  );
}
