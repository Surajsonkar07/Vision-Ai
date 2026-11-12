export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-enter">{children}</div>;
}
