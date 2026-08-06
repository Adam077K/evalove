import { redirect } from "next/navigation";

/**
 * Echo — the surface that reads the record back, for the hours when
 * the other one is asleep.
 *
 * The route is `/echo`, not `/partner` and never `/adam`: hard line 1
 * of `docs/04-features/AI-PARTNER-SPEC.md` is that this must never be
 * mistakable for the real person, and a URL is a string a person
 * reads. An echo returns what was said — which is the spec's rule
 * (quote the record, never predict the person) folded into the name,
 * so the name does some of the work the copy would otherwise have to.
 *
 * Founder decision, 2026-08-06 (`.claude/memory/DECISIONS.md`): the
 * surface list is Today · The Book · Dates — Echo is no longer a
 * destination, so this route redirects rather than serving `EchoChat`
 * directly. The component and this file stay on disk (nothing here is
 * deleted): the strictly-quoting search returns later inside The Book,
 * once it's wired to the record it quotes from.
 */
export default function EchoPage() {
  redirect("/today");
}
