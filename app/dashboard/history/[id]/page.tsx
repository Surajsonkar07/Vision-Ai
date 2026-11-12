import type { Metadata } from "next";
import { ScanDetail } from "./scan-detail";

export const metadata: Metadata = { title: "Scan", robots: { index: false } };

export default async function ScanPage({ params }: PageProps<"/dashboard/history/[id]">) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-7xl">
      <ScanDetail id={id} />
    </div>
  );
}
