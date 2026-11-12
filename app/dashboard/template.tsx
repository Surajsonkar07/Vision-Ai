export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-rise">{children}</div>;
}
