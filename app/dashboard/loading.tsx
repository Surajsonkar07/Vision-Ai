export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-9 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton aspect-[16/9] w-full md:aspect-[21/9]" />
    </div>
  );
}
