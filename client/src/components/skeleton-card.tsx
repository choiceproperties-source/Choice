export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden border border-gray-200 bg-white rounded-lg animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[1.6/1] bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function PropertyCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
