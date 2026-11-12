export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-busy="true" aria-label="Loading scan">
      <div className="space-y-3">
        <div className="skeleton h-8 w-64 max-w-full" />
        <div className="skeleton aspect-video" />
      </div>
      <div className="skeleton h-96" />
    </div>
  );
}
