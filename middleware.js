
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    '/',
    "/profiles",
    "/teams",
    "/tournaments",
    "/matches",
    "/statistics",
  ],
};
