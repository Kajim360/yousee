"use client";
import { useState } from "react";
import Link from "next/link";
import { PickerMap } from "@/components/map";
import { CATEGORIES, COGNITIVE_TYPES, EMOTIONS, KINDS, LOCATION_PRECISION, AGE_RANGES } from "@/lib/domain";
import { EmotionDot, Notice } from "@/components/ui";

type Vertex = [number, number];
type Saved = { id: string; token: string; title: string; createdAt: string };

async function resizeImage(file: File): Promise<{ mimeType: "image/jpeg"; dataBase64: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  // Re-encoding through canvas drops EXIF metadata, including GPS.
  const url = canvas.toDataURL("image/jpeg", 0.75);
  return { mimeType: "image/jpeg", dataBase64: url.split(",")[1] };
}

export function ShareForm({
  defaultInitiative,
  center,
  zoom,
  areas,
}: {
  defaultInitiative: "yousee" | "shelens";
  center: Vertex;
  zoom: number;
  areas: { id: string; name: string }[];
}) {
  const [step, setStep] = useState(1);
  const [initiative, setInitiative] = useState(defaultInitiative);
  const [kind, setKind] = useState<"issue" | "experience" | "cognitive">("experience");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [emotion, setEmotion] = useState<string | null>(null);
  const [emotionNote, setEmotionNote] = useState("");
  const [cognitiveType, setCognitiveType] = useState<string>("important");
  const [observation, setObservation] = useState("");
  const [precision, setPrecision] = useState<string>(defaultInitiative === "shelens" ? "area_only" : "approximate");
  const [geomType, setGeomType] = useState<"point" | "route" | "area">("point");
  const [vertices, setVertices] = useState<Vertex[]>([]);
  const [areaId, setAreaId] = useState("");
  const [image, setImage] = useState<{ mimeType: "image/jpeg"; dataBase64: string } | null>(null);
  const [mode, setMode] = useState<"anonymous" | "pseudonymous">("anonymous");
  const [pseudonym, setPseudonym] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [cPublic, setCPublic] = useState(true);
  const [cResearch, setCResearch] = useState(true);
  const [cDemo, setCDemo] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { id: string; token: string; status: string; areaName: string | null; precisionAdjusted: boolean; locationPrecision: string }>(null);

  const usesMap = precision === "exact" || precision === "approximate";
  const step1Valid = category && title.trim().length >= 3 && body.trim().length >= 10;
  const step2Valid = precision === "none" || (precision === "area_only" ? Boolean(areaId) : vertices.length >= (geomType === "point" ? 1 : geomType === "route" ? 2 : 3));

  function addVertex(lat: number, lng: number) {
    if (geomType === "point") setVertices([[lat, lng]]);
    else setVertices((v) => [...v, [lat, lng]]);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          initiative,
          kind,
          category,
          title,
          body,
          emotion,
          emotionNote: emotionNote || null,
          cognitiveType: kind === "cognitive" ? cognitiveType : null,
          observation: observation || null,
          geometryType: usesMap ? geomType : "none",
          vertices: usesMap ? vertices : [],
          areaId: areaId || null,
          locationPrecision: precision,
          participationMode: mode,
          pseudonym: mode === "pseudonymous" ? pseudonym : null,
          ageRange: cDemo && ageRange ? ageRange : null,
          genderIdentity: cDemo && gender ? gender : null,
          consent: { publicDisplay: cPublic, researchUse: cResearch, demographicUse: cDemo, understood },
          image,
          website: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.issues?.join("; ") || data.error || "Something went wrong");
      const saved: Saved[] = JSON.parse(localStorage.getItem("yousee_contributions") || "[]");
      saved.unshift({ id: data.id, token: data.deleteToken, title, createdAt: new Date().toISOString() });
      localStorage.setItem("yousee_contributions", JSON.stringify(saved.slice(0, 50)));
      setDone({ id: data.id, token: data.deleteToken, status: data.status, areaName: data.areaName, precisionAdjusted: data.precisionAdjusted, locationPrecision: data.locationPrecision });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="card">
          <h2 className="mt-2 text-2xl font-bold">Thank you. Your experience has been received.</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• Status: <strong>{done.status === "flagged" ? "held for privacy review (it may contain a phone number or email)" : "waiting for moderation"}</strong>. It appears publicly only after a moderator approves it{cPublic ? "" : ". You chose not to display it publicly, so it will only be used in aggregated research"}.</li>
            <li>• District: <strong>{done.areaName ?? "not linked to a district"}</strong></li>
            {done.precisionAdjusted && <li>• To protect you, we reduced the public location precision to <strong>{done.locationPrecision.replace("_", " ")}</strong>.</li>}
            <li>• It will <strong>not</strong> be sent to government. For an official response, also use <a className="underline" href="https://www.lapor.go.id" target="_blank" rel="noreferrer">LAPOR!</a>.</li>
          </ul>
          <Notice tone="butter">
            Your private deletion code is saved in this browser under <Link href="/me" className="font-semibold underline">My contributions</Link>. Keep a copy if you may switch devices:{" "}
            ID <code className="break-all rounded bg-white px-1">{done.id}</code> · code <code className="break-all rounded bg-white px-1">{done.token}</code>
          </Notice>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/explore" className="btn-primary">Explore the map</Link>
            <button className="btn-ghost" onClick={() => location.reload()}>Share another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ol className="mb-6 grid grid-cols-3 gap-2 text-xs font-semibold" aria-label="Progress">
        {["Your experience", "The place", "Privacy & consent"].map((s, i) => (
          <li key={s} className={`rounded-full px-3 py-2 text-center ${step === i + 1 ? "bg-ink text-softwhite" : step > i + 1 ? "bg-sky" : "bg-softwhite text-ink-soft"}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="card space-y-5">
          <fieldset>
            <legend className="label">Share through</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["yousee", "shelens"] as const).map((i) => (
                <button key={i} type="button" onClick={() => setInitiative(i)} className={`rounded-xl border px-3 py-3 text-left text-sm ${initiative === i ? "border-ink bg-ink text-softwhite" : "border-ink/20"}`}>
                  <strong>{i === "shelens" ? "SheLens" : "YouSee Open City"}</strong>
                  <span className="block text-xs opacity-80">{i === "shelens" ? "Women's urban experiences" : "Any resident, any topic"}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">What would you like to share?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {KINDS.map((k) => (
                <button key={k.id} type="button" onClick={() => setKind(k.id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${kind === k.id ? "border-ink bg-sky/60" : "border-ink/20"}`}>
                  {k.label}
                </button>
              ))}
            </div>
          </fieldset>
          {kind === "cognitive" && (
            <label className="block">
              <span className="label">How do you relate to this place?</span>
              <select className="input" value={cognitiveType} onChange={(e) => setCognitiveType(e.target.value)}>
                {COGNITIVE_TYPES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
          )}
          <fieldset>
            <legend className="label">Topic</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`rounded-full border px-3 py-1.5 text-sm ${category === c.id ? "border-ink bg-butter font-semibold" : "border-ink/20"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="label">A short title</span>
            <input className="input" maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Street floods after heavy rain" />
          </label>
          <label className="block">
            <span className="label">Tell us in your own words</span>
            <textarea className="input min-h-32" maxLength={3000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What happens, when, and how does it affect your day? Bahasa Indonesia or English are both welcome." />
            <span className="mt-1 block text-xs text-ink-soft">Please don&apos;t include names, phone numbers or addresses.</span>
          </label>
          <fieldset>
            <legend className="label">How does this place make you feel? <span className="font-normal text-ink-soft">(optional)</span></legend>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((e) => (
                <button key={e.id} type="button" aria-pressed={emotion === e.id} onClick={() => setEmotion(emotion === e.id ? null : e.id)} className={`rounded-full border px-3 py-1.5 text-sm ${emotion === e.id ? "border-ink font-semibold" : "border-ink/20"}`} style={emotion === e.id ? { background: e.color + "55" } : undefined}>
                  <EmotionDot id={e.id} /> {e.label}
                </button>
              ))}
            </div>
            {emotion && <input className="input mt-2" maxLength={500} value={emotionNote} onChange={(e) => setEmotionNote(e.target.value)} placeholder="Anything you'd like to add about this feeling? (optional)" />}
          </fieldset>
          <label className="block">
            <span className="label">What did you physically observe? <span className="font-normal text-ink-soft">(optional)</span></span>
            <input className="input" maxLength={1000} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="e.g. Water about 20 cm deep, drain covered with plastic" />
          </label>
          <label className="block">
            <span className="label">Photo <span className="font-normal text-ink-soft">(optional, avoid faces and number plates)</span></span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                setImage(f ? await resizeImage(f) : null);
              }}
            />
            {image && <span className="mt-1 block text-xs text-emerald-800">Photo attached. Location metadata removed.</span>}
          </label>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={!step1Valid} onClick={() => setStep(2)}>Next: the place</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-5">
          <fieldset>
            <legend className="label">How precisely should others see the location?</legend>
            <div className="grid gap-2">
              {LOCATION_PRECISION.map((p) => (
                <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${precision === p.id ? "border-ink bg-sky/40" : "border-ink/20"}`}>
                  <input type="radio" name="precision" checked={precision === p.id} onChange={() => setPrecision(p.id)} />
                  {p.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-soft">The exact point you tap is kept private and visible only to moderators. Public maps always show a rounded location.</p>
          </fieldset>
          {precision === "area_only" && (
            <label className="block">
              <span className="label">District (kecamatan)</span>
              <select className="input" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <option value="">Choose a district…</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          )}
          {usesMap && (
            <>
              <div className="inline-flex rounded-full border border-ink/20 p-1 text-sm">
                {(["point", "route", "area"] as const).map((g) => (
                  <button key={g} type="button" onClick={() => { setGeomType(g); setVertices([]); }} className={`rounded-full px-3 py-1 font-semibold ${geomType === g ? "bg-ink text-softwhite" : ""}`}>
                    {g === "point" ? "Point" : g === "route" ? "Route" : "Area"}
                  </button>
                ))}
              </div>
              <p className="text-sm text-ink-soft">
                {geomType === "point" ? "Tap the map to place your point." : geomType === "route" ? "Tap along the route, at least 2 points." : "Tap the corners of the area, at least 3 points."}
              </p>
              <div className="h-80 overflow-hidden rounded-2xl border border-ink/10">
                <PickerMap center={center} zoom={zoom} mode={geomType} vertices={vertices} onAdd={addVertex} />
              </div>
              {vertices.length > 0 && <button type="button" className="text-sm underline" onClick={() => setVertices([])}>Clear</button>}
            </>
          )}
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" disabled={!step2Valid} onClick={() => setStep(3)}>Next: privacy</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-5">
          <fieldset>
            <legend className="label">How do you want to appear?</legend>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className={`rounded-xl border px-3 py-2.5 ${mode === "anonymous" ? "border-ink bg-sky/40" : "border-ink/20"}`}>
                <input type="radio" checked={mode === "anonymous"} onChange={() => setMode("anonymous")} className="mr-2" />Anonymous
              </label>
              <label className={`rounded-xl border px-3 py-2.5 ${mode === "pseudonymous" ? "border-ink bg-sky/40" : "border-ink/20"}`}>
                <input type="radio" checked={mode === "pseudonymous"} onChange={() => setMode("pseudonymous")} className="mr-2" />A nickname
              </label>
            </div>
            {mode === "pseudonymous" && <input className="input mt-2" maxLength={40} value={pseudonym} onChange={(e) => setPseudonym(e.target.value)} placeholder="Nickname (not your real name)" />}
          </fieldset>

          <div className="rounded-xl border border-ink/15 p-4">
            <button type="button" className="text-sm font-semibold underline" onClick={() => setShowDemo(!showDemo)} aria-expanded={showDemo}>
              {showDemo ? "Hide" : "Optional:"} a little about you
            </button>
            {showDemo && (
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-ink-soft">
                  This helps us see <em>whose</em> experiences are represented and whose are missing. It is never shown publicly and is
                  used only in aggregated counts. Skip it if you prefer.
                </p>
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={cDemo} onChange={(e) => setCDemo(e.target.checked)} className="mt-1" />I agree to YouSee storing the details below for representation analysis.
                </label>
                {cDemo && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className="input" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} aria-label="Age range">
                      <option value="">Age range</option>
                      {AGE_RANGES.map((a) => <option key={a} value={a}>{a === "prefer_not" ? "Prefer not to say" : a}</option>)}
                    </select>
                    <input className="input" maxLength={40} value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Gender, in your own words" aria-label="Gender" />
                  </div>
                )}
              </div>
            )}
          </div>

          <fieldset className="space-y-2 text-sm">
            <legend className="label">Consent</legend>
            <label className="flex items-start gap-2"><input type="checkbox" checked={cPublic} onChange={(e) => setCPublic(e.target.checked)} className="mt-1" />After moderation, my contribution may be displayed publicly at the location precision I chose.</label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={cResearch} onChange={(e) => setCResearch(e.target.checked)} className="mt-1" />My contribution may be included in aggregated, anonymised research and community insights.</label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-1" /><span>I understand that YouSee is a research platform, that this is <strong>not</strong> an official complaint, and that I can delete my contribution later. <Link href="/privacy" className="underline" target="_blank">Privacy policy</Link>.</span></label>
          </fieldset>
          {initiative === "shelens" && <Notice tone="rose">If you are in danger or need urgent help, contact emergency services or the SAPA 129 hotline (see <Link href="/connect" className="underline">Connect</Link>). YouSee is not monitored in real time.</Notice>}
          {error && <Notice tone="rose">{error}</Notice>}
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary" disabled={!understood || busy} onClick={submit}>{busy ? "Sending…" : "Share my experience"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
