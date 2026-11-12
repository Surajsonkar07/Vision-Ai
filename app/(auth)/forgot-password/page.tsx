import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password", description: "Get a link to set a new VisionAI password.", robots: { index: false } };

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
