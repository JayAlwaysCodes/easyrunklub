import { redirect } from "next/navigation";

// Registration is now the disclaimer + wizard modal on the homepage.
export default function RegisterPage() {
  redirect("/?auth=register");
}