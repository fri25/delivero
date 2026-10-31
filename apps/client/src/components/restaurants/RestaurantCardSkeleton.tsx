export function RestaurantCardSkeleton() {
  return (
    <div>
      <div className="shimmer aspect-[3/2] w-full rounded-3xl bg-muted" />
      <div className="space-y-2 px-1 pt-3">
        <div className="shimmer h-4 w-2/3 rounded-full bg-muted" />
        <div className="shimmer h-3 w-1/2 rounded-full bg-muted" />
      </div>
    </div>
  );
}
