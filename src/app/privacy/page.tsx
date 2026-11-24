import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose } from "@/components/ui";
import { CONSENT_VERSION } from "@/lib/domain";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy policy">Consent version {CONSENT_VERSION}. Written in plain language. Pilot draft, pending legal review against Indonesia&apos;s Personal Data Protection Law (UU PDP No. 27/2022).</PageHeader>
      <Prose>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Your contribution:</strong> topic, title, description, and optionally a feeling, an observation, a photo and a location.</li>
          <li><strong>Location:</strong> the point, route or area you tap. The exact geometry is visible only to moderators. Public maps show a rounded version (~100 m, ~1 km) or just the district, as you choose.</li>
          <li><strong>Optional demographics:</strong> age range and self-described gender, only if you tick a separate consent box. They are never shown individually and are reported only in groups of 5 or more.</li>
          <li><strong>Consent record:</strong> which permissions you gave, and when.</li>
        </ul>
        <h2>What we don&apos;t collect</h2>
        <ul>
          <li>No account, real name, phone number or email is required.</li>
          <li>Photos are re-encoded in your browser, which removes location (EXIF) metadata before upload.</li>
          <li>We don&apos;t sell data or use advertising trackers.</li>
        </ul>
        <h2>How it is used</h2>
        <ul>
          <li>Displayed publicly after moderation, only if you consented.</li>
          <li>Included in aggregated, anonymised insights and research, only if you consented.</li>
          <li>Text may be processed by an AI model (Anthropic Claude, when configured) to suggest categories and draft summaries. Phone numbers, emails and ID numbers are stripped first. AI outputs are stored separately and reviewed by people.</li>
        </ul>
        <h2>Your rights</h2>
        <ul>
          <li><strong>Delete:</strong> use <Link href="/me">My contributions</Link> with the private code issued when you shared. Deletion removes the record, photo, consent record and AI outputs.</li>
          <li><strong>Correct or withdraw consent:</strong> delete and re-submit, or contact the pilot team.</li>
        </ul>
        <h2>Retention</h2>
        <p>Pilot contributions are kept for the duration of the pilot research and reviewed at its end. Rejected contributions should be purged after 90 days. This is currently a manual procedure (see PRIVACY_AND_SECURITY.md).</p>
        <h2>Not an official channel</h2>
        <p>YouSee does not forward contributions to government. For official complaints use LAPOR!.</p>
      </Prose>
    </>
  );
}
