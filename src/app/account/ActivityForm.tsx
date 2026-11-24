"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIVITY_KINDS } from "@/lib/domain";

export function ActivityForm() {
  const router = useRouter();
  const [kind, setKind] = useState<string>("environment");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, title, description, evidenceUrl: evidenceUrl || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setOk(true);
      setMsg("Submitted. A moderator will check the evidence before points are awarded.");
      setTitle("");
      setDescription("");
      setEvidenceUrl("");
      router.refresh();
    } else {
      setMsg(data.issues?.join("; ") || data.error || "Could not submit");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <select className="input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Activity type">
        {ACTIVITY_KINDS.map((k) => (
          <option key={k.id} value={k.id}>{k.label} ({k.points} points after review)</option>
        ))}
      </select>
      <input className="input" placeholder="Short title, e.g. Organised a drainage clean-up" maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input min-h-24" placeholder="What did you do, with whom, and where? Please avoid personal details." maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
      <input className="input" placeholder="Public evidence link (optional but helps verification)" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} />
      {msg && <p className={`rounded-xl px-3 py-2 text-sm ${ok ? "bg-emerald-50 text-emerald-900" : "bg-rose/50"}`}>{msg}</p>}
      <button className="btn-primary" disabled={busy || title.length < 5 || description.length < 20} onClick={submit}>
        {busy ? "Submitting…" : "Submit action for review"}
      </button>
    </div>
  );
}
