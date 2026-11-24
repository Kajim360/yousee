"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIVITY_KINDS } from "@/lib/domain";
import { Notice } from "@/components/ui";

const PROVIDERS = [
  { id: "google", label: "Continue with Google", env: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" },
  { id: "apple", label: "Continue with Apple", env: "APPLE_CLIENT_ID / APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY" },
  { id: "facebook", label: "Continue with Facebook", env: "FACEBOOK_APP_ID / FACEBOOK_APP_SECRET" },
];

export function LoginClient({ notice, provider }: { notice?: string; provider?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [phoneStep, setPhoneStep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noticeText: Record<string, string> = {
    "not-configured": `${provider ?? "That"} sign-in is not configured yet. The system operator must add the provider credentials listed below. Email, password and phone sign-in work now.`,
    "oauth-failed": "The provider could not complete sign-in. Please try again or use email / phone.",
    "oauth-state": "The sign-in request expired or could not be verified. Please try again.",
    "oauth-denied": "Sign-in was cancelled.",
    "admin-not-allowed": "Administrator accounts cannot use social sign-in.",
    "unknown-provider": "Unknown sign-in provider.",
    "signed-out": "You have been signed out.",
  };

  async function post(url: string, body: object) {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function submitCredentials() {
    setBusy(true);
    setError(null);
    const { res, data } = await post("/api/auth/credentials", { mode, email, password, displayName: name });
    if (res.ok) {
      router.push("/account");
      router.refresh();
    } else {
      setError(data.error ?? "Could not sign in");
      setBusy(false);
    }
  }

  async function requestCode() {
    setBusy(true);
    setError(null);
    const { res, data } = await post("/api/auth/phone/request", { phone });
    if (!res.ok) {
      setError(data.error ?? "Could not send a code");
    } else {
      setPhoneStep(true);
      if (data.delivery === "demo") setDemoCode(data.demoCode);
    }
    setBusy(false);
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const { res, data } = await post("/api/auth/phone/verify", { phone, code, displayName: name || undefined });
    if (res.ok) {
      router.push("/account");
      router.refresh();
    } else {
      setError(data.error ?? "Could not verify");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      {notice && noticeText[notice] && <div className="mb-4"><Notice tone="butter">{noticeText[notice]}</Notice></div>}
      <div className="inline-flex rounded-full border border-ink/20 bg-softwhite p-1">
        {(["email", "phone"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setError(null); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t ? "bg-ink text-softwhite" : ""}`}>
            {t === "email" ? "Email" : "Phone number"}
          </button>
        ))}
      </div>

      {tab === "email" && (
        <div className="mt-5 space-y-3">
          <div className="flex gap-2 text-sm">
            <button onClick={() => setMode("login")} className={`flex-1 rounded-xl border px-3 py-2 font-semibold ${mode === "login" ? "border-ink bg-sky/50" : "border-ink/20"}`}>Sign in</button>
            <button onClick={() => setMode("register")} className={`flex-1 rounded-xl border px-3 py-2 font-semibold ${mode === "register" ? "border-ink bg-rose/60" : "border-ink/20"}`}>Create account</button>
          </div>
          {mode === "register" && <input className="input" placeholder="Display name (shown on the recognition board)" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />}
          <input className="input" type="email" placeholder="Email address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password (at least 8 characters)" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === "register" && <p className="text-xs text-ink-soft">Creating an account does not change your privacy choices when you report: you can still share anonymously and choose how much location to reveal.</p>}
          <button className="btn-primary w-full" disabled={busy || !email || password.length < 8} onClick={submitCredentials}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </div>
      )}

      {tab === "phone" && (
        <div className="mt-5 space-y-3">
          <input className="input" type="tel" placeholder="+628123456789" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={phoneStep} />
          {!phoneStep && mode === "register" && <input className="input" placeholder="Display name (optional)" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />}
          {phoneStep && (
            <>
              <input className="input" inputMode="numeric" placeholder="6-digit code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              {demoCode && (
                <Notice tone="butter">
                  <strong>Preview mode:</strong> no SMS provider is configured, so the code is shown here: <code className="rounded bg-white px-1 font-bold">{demoCode}</code>. In production the code is sent by SMS and never displayed.
                </Notice>
              )}
            </>
          )}
          <button className="btn-primary w-full" disabled={busy || (!phoneStep ? phone.length < 8 : code.length !== 6)} onClick={phoneStep ? verifyCode : requestCode}>
            {busy ? "Please wait…" : phoneStep ? "Verify and sign in" : "Send verification code"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 rounded-xl bg-rose/50 px-3 py-2 text-sm">{error}</p>}

      <div className="my-6 flex items-center gap-3 text-xs text-ink-soft">
        <span className="h-px flex-1 bg-ink/15" /> OR CONTINUE WITH <span className="h-px flex-1 bg-ink/15" />
      </div>
      <div className="space-y-2">
        {PROVIDERS.map((p) => (
          <a key={p.id} href={`/api/auth/oauth/${p.id}`} className="btn-ghost w-full !justify-center">
            {p.label}
          </a>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        Social sign-in requires credentials from the provider. Until the operator sets {PROVIDERS.map((p) => p.env).join(", ")}, these buttons explain what is missing instead of pretending to sign you in.
      </p>

      <div className="mt-6 rounded-xl bg-sky/40 p-4 text-xs text-ink">
        <p className="font-semibold">How recognition works</p>
        <p className="mt-1">Approved incident reports earn 10 points. Verified climate-justice, policy, environmental and community actions earn {ACTIVITY_KINDS.map((k) => k.points).join("/")} points. Moderators can award kudos with a written reason. Points are not money, votes or official endorsement.</p>
      </div>
    </div>
  );
}
