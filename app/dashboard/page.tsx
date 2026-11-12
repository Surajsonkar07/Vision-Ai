import type { Metadata } from "next";
import { Overview } from "./overview";

export const metadata: Metadata = { title: "Console" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <Overview />
    </div>
  );
}
