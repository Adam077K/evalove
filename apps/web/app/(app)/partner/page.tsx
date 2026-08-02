import type { Metadata } from "next";
import { PartnerChat } from "@/components/partner/PartnerChat";

export const metadata: Metadata = {
  title: "The echo — Eva & Adam",
};

/**
 * The partner conversation — an AI that keeps their shared story,
 * for the hours when the other one is asleep. The surface is real;
 * the model behind it is being specced in parallel, and until it
 * lands the echo answers honestly about what it can't yet do.
 */
export default function PartnerPage() {
  return <PartnerChat />;
}
