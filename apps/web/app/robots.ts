import type { MetadataRoute } from "next";

/**
 * /robots.txt — refuse every crawler, every path.
 *
 * This app has two users and will never have a third. There is no marketing
 * surface (`app/page.tsx` redirects straight to /today), nothing here wants to
 * be found, and a search result carrying either of their names is a harm with
 * no upside. Disallow everything rather than curate a list: a list acquires
 * holes as routes are added, and nobody notices until a route is indexed.
 *
 * THIS IS A REQUEST, NOT A CONTROL. robots.txt is a convention that
 * well-behaved crawlers honour and everything else ignores. It is not what
 * keeps this app private — `middleware.ts` and the `require*` functions in
 * `lib/session/` are. Two independent layers back this file up:
 *
 *   1. `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`
 *      on every response, set in `vercel.json`. Unlike robots.txt, that header
 *      travels with a page even when it is reached by a link rather than a
 *      crawl — and a page that is Disallow-ed here can still be indexed from
 *      an inbound link, URL-only, which is exactly the failure the header
 *      closes.
 *   2. Every route worth indexing needs a session, so a crawler that ignores
 *      both gets a 307 to /login and nothing else.
 *
 * The file itself is public and must be: `/robots.txt` carries a file
 * extension, so `middleware.ts`'s matcher never runs for it (verified against
 * the matcher regex, not assumed). Its allowlist entry for this path is
 * therefore redundant — see RUNBOOK-deploy-vercel.md §6.
 *
 * Deliberately no `sitemap` key. A sitemap on an app that disallows everything
 * is a contradiction, and it would be a list of this couple's routes published
 * at a guessable path.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  };
}
