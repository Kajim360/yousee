"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Notice, StatusTag } from "@/components/ui";

type Saved = { id: string; token: string; title: string; createdAt: string; status?: string };

export default function MePage() {
  const [items, setItems] = useState<Saved[]>([]);
  const [manualId, setManualId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved: Saved[] = JSON.parse(localStorage.getItem("yousee_contributions") || "[]");
    Promise.all(
      saved.map(async (s) => {
        const r = await fetch(`/api/contributions/${s.id}?token=${encodeURIComponent(s.token)}`);
        if (!r.ok) return { ...s, status: "deleted" };
        const d = await r.json();
        return { ...s, status: d.status as string };
      })
    ).then(setItems);
  }, []);

  async function remove(id: string, token: string) {
    if (!confirm("Delete this contribution permanently? This also removes its photo, consent record and AI outputs.")) return;
    const r = await fetch(`/api/contributions/${id}`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
    if (r.ok) {
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      localStorage.setItem("yousee_contributions", JSON.stringify(next.map(({ status: _s, ...rest }) => rest)));
      setMsg("Deleted.");
    } else setMsg("Could not delete. Check the ID and code.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="eyebrow">Your profile</p>
      <h1 className="mt-2 text-3xl font-bold">My contributions</h1>
      <p className="mt-2 text-ink-soft">YouSee has no accounts. Your contributions are linked to this browser by private deletion codes that only you hold.</p>
      {msg && <div className="mt-4"><Notice>{msg}</Notice></div>}
      <div className="mt-6 space-y-3">
        {items.map((i) => (
          <div key={i.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{i.title}</p>
              <p className="text-xs text-ink-soft">{new Date(i.createdAt).toLocaleString()} · {i.status && <StatusTag status={i.status} />}</p>
            </div>
            {i.status !== "deleted" && <button className="btn-ghost" onClick={() => remove(i.id, i.token)}>Delete</button>}
          </div>
        ))}
        {items.length === 0 && (
          <div className="card text-sm text-ink-soft">No contributions saved in this browser. <Link href="/share" className="font-semibold underline">Share one</Link>.</div>
        )}
      </div>
      <details className="card mt-6">
        <summary className="cursor-pointer font-semibold">Delete using a saved code from another device</summary>
        <div className="mt-3 space-y-2">
          <input className="input" placeholder="Contribution ID" value={manualId} onChange={(e) => setManualId(e.target.value.trim())} />
          <input className="input" placeholder="Private deletion code" value={manualToken} onChange={(e) => setManualToken(e.target.value.trim())} />
          <button className="btn-primary" disabled={!manualId || !manualToken} onClick={() => remove(manualId, manualToken)}>Delete</button>
        </div>
      </details>
    </div>
  );
}
