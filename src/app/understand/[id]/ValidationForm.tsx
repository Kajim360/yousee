"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ValidationForm({ insightId }: { insightId: string }) {
  const router = useRouter();
  const [verdict, setVerdict] = useState<"agree" | "partially" | "disagree" | "">("");
  const [role, setRole] = useState("resident");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit() {
    setState("busy");
    const res = await fetch(`/api/insights/${insightId}/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ verdict, reviewerRole: role, comment }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setState("done");
      router.refresh();
    } else {
      setState("error");
      setMsg(data.error ?? "Could not save");
    }
  }

  if (state === "done") return <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Thank you. Your review was recorded.</p>;
  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {([["agree", "Yes"], ["partially", "Partly"], ["disagree", "No"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setVerdict(v)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${verdict === v ? "border-ink bg-sky/60" : "border-ink/20"}`}>{l}</button>
        ))}
      </div>
      <select className="input" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Your role">
        <option value="resident">I live or work in the area</option>
        <option value="facilitator">Community facilitator</option>
        <option value="researcher">Researcher / analyst</option>
        <option value="expert">Practitioner / expert</option>
      </select>
      <textarea className="input min-h-20" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What is missing, wrong or right? (optional, no personal details)" />
      {state === "error" && <p className="text-sm text-rose-deep">{msg}</p>}
      <button className="btn-primary" disabled={!verdict || state === "busy"} onClick={submit}>{state === "busy" ? "Saving…" : "Submit review"}</button>
    </div>
  );
}
