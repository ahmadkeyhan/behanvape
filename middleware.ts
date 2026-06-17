export { default } from "next-auth/middleware";

// Protect /admin and everything under it, EXCEPT /admin/login.
// Unauthenticated requests are redirected to the signIn page (/admin/login).
export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
