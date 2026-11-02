export function RestaurantCardSkeleton() {
  return (
    <div className="carte overflow-hidden">
      <div className="shimmer aspect-[3/2] w-full bg-muted" />
      <div className="space-y-2 p-3.5">
        <div className="shimmer h-4 w-2/3 rounded bg-muted" />
        <div className="shimmer h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}
