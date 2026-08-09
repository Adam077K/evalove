import type { MetadataRoute } from "next";

/**
 * /manifest.webmanifest — what a phone needs to install this as an app.
 *
 * `middleware.ts` has allowlisted `/manifest.webmanifest` since the door was
 * written; until now no file answered there. This is that file. Adding it
 * publishes it: the path carries a file extension, so the middleware matcher
 * never runs for it at all, and it is readable by anyone who requests it —
 * with or without the allowlist entry. See RUNBOOK-deploy-vercel.md §6.
 *
 * WHAT THIS PUBLISHES, exactly, because publishing it is the point and the
 * cost should be stated rather than discovered: the name "Eva & Adam", the
 * description "The sky between two cities.", two paper colours, and the fact
 * that the app opens at "/". Two first names and a sentence. No surname, no
 * city, no photograph, no route beyond the root. Anything added to this file
 * later is published on the same terms — check that list again before adding.
 *
 * NO `icons` ARRAY, deliberately. An icon is artwork, and inventing one for a
 * project whose founder judges designs on sight would be a devops agent making
 * a design decision. The consequence is honest and worth knowing: Chrome and
 * Android will NOT offer "Install app" without a 192px and a 512px icon, and
 * iOS "Add to Home Screen" will fall back to a screenshot of the page instead
 * of an icon. The app is fully usable either way — this affects the home-screen
 * tile, nothing else. RUNBOOK-deploy-vercel.md §7 lists the exact files and
 * sizes to drop in when someone supplies the art; no code change is needed
 * beyond adding the array here.
 *
 * `start_url: "/"` matches `app/page.tsx`, which redirects to /today. Signed
 * out, the door catches it and /login is what opens — correct, and the reason
 * start_url is not /today directly: the redirect is the app's own decision
 * about where it opens, and it should stay in one place.
 *
 * The two colours are the same paper values as `viewport.themeColor` in
 * app/layout.tsx (#F8F5F1 light, #BAB1A2 night — the paper dims, it never
 * inverts). `theme_color` is the light one because a manifest carries a single
 * value and cannot follow prefers-color-scheme; the layout's media-query pair
 * is what actually tints the browser chrome. If those hexes change there, they
 * change here.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eva & Adam",
    short_name: "Eva & Adam",
    description: "The sky between two cities.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8F5F1",
    theme_color: "#F8F5F1",
  };
}
