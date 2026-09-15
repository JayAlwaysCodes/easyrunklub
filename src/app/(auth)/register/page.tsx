import type { Metadata } from "next";
import { RegisterForm } from "@/components/shared/register-form";

export const metadata: Metadata = {
  title: "Join | Easy Run Klub",
};

export default function RegisterPage() {
  return <RegisterForm />;
}