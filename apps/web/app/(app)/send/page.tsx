import type { Metadata } from "next";
import { Column } from "@/components/chrome/Column";
import { Paper } from "@/components/materials";
import { QuickSend } from "@/components/send/QuickSend";

export const metadata: Metadata = {
  title: "Send — Eva & Adam",
};

/**
 * Quick send — deliberately lighter than the daily ritual. A glance,
 * not a page: a small photograph, a line, or both, dropped into the
 * other one's day. Sent things queue through the outbox and keep
 * trying; nothing here ever dead-ends.
 *
 * `<Paper>` wraps `<Column>` rather than the other way round — this
 * route was sitting straight on `--canvas-base`'s flat fill, so
 * `.card` ("a plate laid on the page... white stock on warm stock,"
 * globals.css) had no warm stock underneath it, just a colour. Same
 * substrate Today and The Book already use; Column still does its own
 * job of constraining width and reserving the dock's footprint.
 */
export default function SendPage() {
  return (
    <Paper stock="coldpress">
      <Column>
        <QuickSend />
      </Column>
    </Paper>
  );
}
