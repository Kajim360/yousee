"use client";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/domain";
import { Notice } from "@/components/ui";

export function SupportButton({ id, count }: { id: string; count: number }) {
  const [n, setN] = useState(count);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const s: string[] = JSON.parse(localStorage.getItem("yousee_supported") || "[]");
    if (s.includes(id)) setDone(true);
  }, [id]);
  async function support() {
    if (done) return;
    setDone(true);
    setN((x) => x + 1);
    const s: string[] = JSON.parse(localStorage.getItem("yousee_supported") || "[]");
    localStorage.setItem("yousee_supported", JSON.stringify([...s, id]));
    await fetch("/api/proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "support", id }) });
  }
  return (
    <button onClick={support} disabled={done} className={`rounded-full border px-3 py-1 text-sm font-semibold ${done ? "border-ink bg-butter" : "border-ink/20 hover:bg-ink/5"}`}>
      {done ? "Supported" : "Support"} · {n}
    </button>
  );
}

export function ProposalForm({ areas, insightId, insightTitle }: { areas: { id: string; name: string }[]; insightId?: string; insightTitle?: string }) {
  const [f, setF] = useState({ initiative: "yousee", title: "", description: "", category: "", areaId: "", authorPseudonym: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setState("busy");
    setErr(null);
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f, areaId: f.areaId || null, insightId: insightId ?? null, authorPseudonym: f.authorPseudonym || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setState("done");
    else {
      setState("idle");
      setErr(data.issues?.join("; ") ?? data.error ?? "Could not submit");
    }
  }

  if (state === "done") return <Notice>Thank you. Your proposal was received and will appear after moderation. Its status will stay “Proposed” until there is verified evidence of any institutional response.</Notice>;
  return (
    <div className="space-y-3">
      {insightTitle && <Notice>Linked to insight: <strong>{insightTitle}</strong></Notice>}
      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={f.initiative} onChange={set("initiative")} aria-label="Initiative">
          <option value="yousee">YouSee Open City</option>
          <option value="shelens">SheLens</option>
        </select>
        <select className="input" value={f.category} onChange={set("category")} aria-label="Topic">
          <option value="">Topic…</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <input className="input" placeholder="Proposal title" maxLength={140} value={f.title} onChange={set("title")} />
      <textarea className="input min-h-28" placeholder="What would you suggest, and which experiences or insights is it based on?" maxLength={2000} value={f.description} onChange={set("description")} />
      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={f.areaId} onChange={set("areaId")} aria-label="District">
          <option value="">Citywide / not specific</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input" placeholder="Nickname (optional)" maxLength={40} value={f.authorPseudonym} onChange={set("authorPseudonym")} />
      </div>
      {err && <p className="text-sm text-rose-deep">{err}</p>}
      <button className="btn-primary" onClick={submit} disabled={state === "busy" || !f.category || f.title.length < 5 || f.description.length < 20}>
        {state === "busy" ? "Submitting…" : "Submit proposal"}
      </button>
    </div>
  );
}
