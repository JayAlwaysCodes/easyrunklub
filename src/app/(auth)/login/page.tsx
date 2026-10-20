import { redirect } from "next/navigation";

// Login is now a modal on the homepage. This route stays so that older
// links and Auth.js redirects still land somewhere useful.
export default function LoginPage() {
  redirect("/?auth=login");
}