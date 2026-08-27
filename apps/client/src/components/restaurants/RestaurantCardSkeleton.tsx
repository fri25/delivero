export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div className="shimmer aspect-[3/2] w-full bg-muted" />
      <div className="space-y-2 px-3.5 py-3">
        <div className="shimmer h-3.5 w-2/3 rounded-full bg-muted" />
        <div className="shimmer h-3 w-1/3 rounded-full bg-muted" />
      </div>
    </div>
  );
}
