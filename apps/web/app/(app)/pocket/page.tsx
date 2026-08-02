import type { Metadata } from "next";
import { PocketGate } from "@/components/pocket/PocketGate";

export const metadata: Metadata = {
  title: "The pocket — Eva & Adam",
};

/**
 * The pocket — private things, behind the passphrase, every time.
 * Nothing inside is ever previewed, thumbnailed, or cached in the
 * ordinary flow. This route renders the gate and only the gate;
 * items are fetched one at a time after it opens. Non-waivable.
 */
export default function PocketPage() {
  return <PocketGate />;
}
