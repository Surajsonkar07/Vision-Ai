export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Loading">
      <div className="frame-corners size-16 border border-border" />
    </div>
  );
}
