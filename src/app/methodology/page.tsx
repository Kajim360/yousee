import type { Metadata } from "next";
import { PHOTOS } from "@/lib/media";
import { PageHeader, Prose, LayerTag } from "@/components/ui";
import { ANALYTICAL_FRAMES, EMOTIONS, COGNITIVE_TYPES } from "@/lib/domain";

export const metadata: Metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <>
      <PageHeader eyebrow="Methodology" title="The YouSee Intelligence Framework" photo={PHOTOS["city-night"]}>
        How lived experiences become contextualised, reviewable urban understanding, and what we do not yet claim.
      </PageHeader>
      <Prose>
        <p><strong>Status:</strong> exploratory. This methodology has not yet been validated through pilot research. Nothing on YouSee should be read as a validated finding until that research is done and published.</p>
        <h2>Foundational question</h2>
        <p>How can cities become more intelligent by learning from the lived experiences and collective intelligence of their inhabitants?</p>

        <h2>The six stages</h2>
        <ol>
          <li><strong>Emotional mapping:</strong> residents may say how a place makes them feel (optional).</li>
          <li><strong>Cognitive mapping:</strong> residents describe how they perceive, use, avoid or remember places, as points, routes or areas.</li>
          <li><strong>Spatial contextualisation:</strong> contributions are linked to a district (currently by nearest approximate centroid) and to relevant documented sources.</li>
          <li><strong>AI-assisted interpretation:</strong> a model, or a transparent heuristic when none is configured, <em>suggests</em> topics, themes and an exploratory frame, and drafts insights. All outputs are stored separately with model and prompt version.</li>
          <li><strong>Collective validation:</strong> moderators review AI suggestions; draft insights go to community review, and cannot be published without at least one validation response.</li>
          <li><strong>Civic insight:</strong> published insights link to their original records and sources, with confidence, uncertainty and representation notes.</li>
        </ol>

        <h2>Eight distinct layers</h2>
        <p>Every insight keeps these separate, and the interface labels each one:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <LayerTag kind="citizen" /><LayerTag kind="emotion" /><LayerTag kind="observation" /><LayerTag kind="spatial" /><LayerTag kind="evidence" /><LayerTag kind="ai" /><LayerTag kind="validation" /><LayerTag kind="insight" />
        </div>

        <h2>Emotional input (user-facing)</h2>
        <p>Simple and optional: {EMOTIONS.map((e) => e.label).join(", ")}. A free-text note is allowed. Residents are never required to disclose feelings, and their choice is never re-labelled.</p>

        <h2>Analytical frame (researcher-facing)</h2>
        <p>Researchers may use an exploratory six-part lens describing a person&apos;s <em>relationship with a place</em>:</p>
        <ul>
          {ANALYTICAL_FRAMES.map((f) => (
            <li key={f.id}><span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: f.color }} /><strong>{f.label}</strong>: {f.gloss}</li>
          ))}
        </ul>
        <h3>Assumptions and limitations</h3>
        <ul>
          <li>These categories are borrowed by analogy from stress-response vocabulary. They are <strong>not</strong> clinical diagnoses, psychological assessments or validated classifications.</li>
          <li>A selected emotion is never automatically mapped to a frame. “Unsafe” does not imply “Flight”.</li>
          <li>AI may suggest a frame with a rationale and confidence. Suggestions are reviewable and default to “Unknown” when the text is unclear.</li>
          <li>Frames describe a contribution, never a person or a community.</li>
        </ul>

        <h2>Cognitive mapping</h2>
        <p>Residents can share: {COGNITIVE_TYPES.map((c) => c.label.toLowerCase()).join("; ")}. They can use points, routes or areas, or no location at all.</p>

        <h2>Interpretation safeguards</h2>
        <ul>
          <li>Correlation is not causation. YouSee does not explain why an issue occurs unless residents or cited sources say so.</li>
          <li>Many reports in one place do not mean a problem is most prevalent there. The Understand page shows coverage gaps.</li>
          <li>No area or community is labelled “unsafe”. We describe what residents reported.</li>
          <li>Personal identifiers are stripped before text is sent to an AI model.</li>
          <li>Insights drawn from fewer than 5 records are always marked low confidence.</li>
        </ul>

        <h2>Planned evaluation</h2>
        <ul>
          <li>Interpretive consistency: agreement between independent human coders, and between humans and AI suggestions (logged in Admin, AI evaluation).</li>
          <li>Participant understanding of the form and consent, through facilitated sessions.</li>
          <li>Spatial accuracy, and how well the location-precision options are understood.</li>
          <li>Representation bias: coverage by district and, with consent, by self-described group.</li>
          <li>Faithfulness of summaries to source records, and hallucination rate in Ask Your City.</li>
          <li>Usefulness for researchers and practitioners, through structured interviews.</li>
        </ul>
        <p>Baselines will be measured during the first pilot cycle before any targets are set.</p>
      </Prose>
    </>
  );
}
