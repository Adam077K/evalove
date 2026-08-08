import type { Metadata } from "next";
import { Column } from "@/components/chrome/Column";
import { PocketGate } from "@/components/pocket/PocketGate";

export const metadata: Metadata = {
  title: "The pocket — Eva & Adam",
};

/**
 * The pocket — private things, behind the passphrase, every time.
 * Nothing inside is ever previewed, thumbnailed, or cached in the
 * ordinary flow. This route renders the gate and only the gate;
 * items are fetched one at a time after it opens. Non-waivable.
 *
 * Column, the same choice as /book/days: `PocketGate`'s own root is a
 * centred flex column with no horizontal padding of its own — at
 * 393px its `measure`d body copy ran flush to both viewport edges.
 * Column's gutter fixes that without PocketGate needing to know its
 * own padding; removal of this route is a founder decision that is
 * decided but unscheduled, so this file stays.
 */
export default function PocketPage() {
  return (
    <Column>
      <PocketGate />
    </Column>
  );
}
