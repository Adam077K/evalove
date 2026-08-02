import type { Metadata } from "next";
import { QuickSend } from "@/components/send/QuickSend";

export const metadata: Metadata = {
  title: "Send — Eva & Adam",
};

/**
 * Quick send — deliberately lighter than the daily ritual. A glance,
 * not a page: a small photograph, a line, or both, dropped into the
 * other one's day. Sent things queue through the outbox and keep
 * trying; nothing here ever dead-ends.
 */
export default function SendPage() {
  return <QuickSend />;
}
