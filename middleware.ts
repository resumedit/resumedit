import { authMiddleware } from "@clerk/nextjs";
// https://clerk.com/docs/references/nextjs/auth-middleware#making-pages-public-using-public-routes
export default authMiddleware({
  // "/" will be accessible to all users
  publicRoutes: ["/", "/item(/.*)?"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
