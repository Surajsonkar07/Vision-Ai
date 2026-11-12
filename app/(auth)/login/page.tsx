import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to sync your VisionAI scans across devices." };

export default function LoginPage() {
  return <LoginForm />;
}
