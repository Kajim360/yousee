import type { Metadata } from "next";
import Link from "next/link";
import { PHOTOS } from "@/lib/media";
import { PageHeader, Prose } from "@/components/ui";

export const metadata: Metadata = { title: "About YouSee" };

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="YouSee: Human-Centered Urban Intelligence" tone="sky" photo={PHOTOS["city-pasig"]}>
        A civic interface connecting people, places, knowledge and urban decision-making.
      </PageHeader>
      <Prose>
        <h2>Vision</h2>
        <p>A world where cities continuously learn, adapt and evolve through the collective intelligence of their people.</p>
        <h2>Mission</h2>
        <p>To connect human experiences, spatial understanding, urban evidence and collective intelligence through accessible participatory methods and responsible AI.</p>
        <h2>Core proposition</h2>
        <p>Human experiences, then spatial understanding, collective intelligence, urban evidence, civic possibilities and more responsive cities.</p>
        <h2>What YouSee is not</h2>
        <ul>
          <li>Not a complaint-reporting app. For official complaints use <a href="https://www.lapor.go.id" target="_blank" rel="noreferrer">LAPOR!</a>.</li>
          <li>Not a generic chatbot. Ask Your City answers only from documented evidence.</li>
          <li>Not a smart-city dashboard or social network.</li>
        </ul>
        <h2>Five interconnected domains</h2>
        <ol>
          <li><strong>Architecture & urbanism:</strong> people, spatial environments, morphology, place identity.</li>
          <li><strong>Human-centered urbanism:</strong> how people experience, navigate and relate to places.</li>
          <li><strong>Collective intelligence:</strong> individual observations becoming shared understanding.</li>
          <li><strong>Urban informatics & AI:</strong> organising and interpreting complex urban information.</li>
          <li><strong>Participatory governance:</strong> connecting community knowledge with institutional processes.</li>
        </ol>
        <h2>Pilot</h2>
        <p>Bandar Lampung, Indonesia, is the first pilot city. The platform is built so that new cities and thematic initiatives can be added without rebuilding the core. <Link href="/shelens">SheLens</Link> is the first initiative.</p>
        <h2>Who it serves</h2>
        <p>Residents, community facilitators, researchers and analysts, moderators and, later, institutional stakeholders through aggregated insight views.</p>
      </Prose>
    </>
  );
}
