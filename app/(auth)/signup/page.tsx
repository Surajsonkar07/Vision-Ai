import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account", description: "Create a VisionAI account to sync scans across devices." };

export default function SignupPage() {
  return <SignupForm />;
}
