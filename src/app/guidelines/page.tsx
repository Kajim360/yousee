import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/ui";

export const metadata: Metadata = { title: "Community Guidelines" };

export default function GuidelinesPage() {
  return (
    <>
      <PageHeader eyebrow="Community" title="Community guidelines" tone="butter">Simple rules that keep YouSee respectful, safe and useful.</PageHeader>
      <Prose>
        <h2>Please do</h2>
        <ul>
          <li>Share your own experience in your own words, in Bahasa Indonesia, Bahasa Lampung or English.</li>
          <li>Describe places, conditions and how they affect you.</li>
          <li>Respect perspectives that differ from yours.</li>
        </ul>
        <h2>Please don&apos;t</h2>
        <ul>
          <li>Include names, phone numbers, addresses, faces or number plates, yours or anyone else&apos;s.</li>
          <li>Accuse identifiable people, or post hate speech, harassment or discriminatory content about any group.</li>
          <li>Label an entire neighbourhood or community as dangerous or bad. Describe what you experienced.</li>
          <li>Post advertising, political campaigning or knowingly false information.</li>
        </ul>
        <h2>Moderation</h2>
        <p>Every contribution and proposal is reviewed by a person before it appears publicly. Text that looks like it contains a phone number or email is automatically held for privacy review. Moderators may reject content that breaks these guidelines. Every moderation action is recorded in an audit log.</p>
        <h2>Corrections</h2>
        <p>If you think an insight misrepresents your community, use the review form on the insight page. Disagreement is recorded and shown.</p>
      </Prose>
    </>
  );
}
