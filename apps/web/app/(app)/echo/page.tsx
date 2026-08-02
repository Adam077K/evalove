import type { Metadata } from "next";
import { EchoChat } from "@/components/echo/EchoChat";

export const metadata: Metadata = {
  title: "Echo — Eva & Adam",
};

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
 * The surface is real; the model behind it is being specced in
 * parallel, and until it lands the echo answers honestly about what
 * it can't yet do rather than inventing an answer.
 */
export default function EchoPage() {
  return <EchoChat />;
}
