export { auth as middleware } from "@/server/auth";

export const config = {
  // Run on everything except static assets, images, and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};