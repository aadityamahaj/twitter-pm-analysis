export function FlightSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-6 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-7 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-sky-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
