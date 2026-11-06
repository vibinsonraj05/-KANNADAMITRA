"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Icon from "@/components/Icon";
import { Eye, EyeOff, Sparkles, Check } from "lucide-react";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");

    if (signup && password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (signup && password.length < 10) {
      setError("Password must be at least 10 characters long.");
      return;
    }

    setBusy(true);

    const payload: Record<string, string> = {
      email: email.trim().toLowerCase(),
      password,
    };
    if (signup) payload.name = name.trim();

    try {
      const response = await fetch(`/api/auth/${signup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || (signup ? "Could not create account." : "Could not sign in."));
      sessionStorage.setItem("kannadamitra-welcome-pending", "true");
      router.replace("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connection failed. Please retry.");
      setBusy(false);
    }
  }

  const fillDemoAccount = () => {
    if (signup) {
      setName("Demo Learner");
    }
    setEmail("demo@kannadamitra.com");
    setPassword("KannadaMitra2026!");
    if (signup) {
      setConfirmPassword("KannadaMitra2026!");
    }
    setError("");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-brand" aria-label="KannadaMitra Home">
          <span className="app-brand-mark" lang="kn">ಕ</span>
          <strong>KannadaMitra</strong>
        </Link>
        <span className="eyebrow">YOUR KANNADA JOURNEY</span>
        <h1>{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-intro">
          {signup
            ? "Save your learning progress, translations, and pick up where you left off."
            : "Sign in to continue learning, translating, and exploring Kannada."}
        </p>

        <div className="auth-demo-banner">
          <button
            type="button"
            className="auth-demo-btn"
            onClick={fillDemoAccount}
            title="Pre-fill with preconfigured demo account"
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>Fill Demo Credentials</span>
          </button>
        </div>

        <form onSubmit={submit} className="auth-form" noValidate={false}>
          {signup && (
            <label>
              <span>Full name</span>
              <input
                autoComplete="name"
                name="name"
                required
                minLength={2}
                maxLength={60}
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>
          )}

          <label>
            <span>Email address</span>
            <input
              autoComplete="email"
              name="email"
              type="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <div className="auth-input-password-wrap">
              <input
                autoComplete={signup ? "new-password" : "current-password"}
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={signup ? 10 : 1}
                maxLength={128}
                placeholder={signup ? "At least 10 characters" : "Your password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {signup && (
              <span className={`auth-field-hint ${password.length >= 10 ? "is-valid" : ""}`}>
                {password.length >= 10 && <Check size={12} className="hint-check" />}
                {password.length >= 10 ? "Password meets length requirement" : "At least 10 characters required"}
              </span>
            )}
          </label>

          {signup && (
            <label>
              <span>Confirm password</span>
              <div className="auth-input-password-wrap">
                <input
                  autoComplete="new-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={10}
                  maxLength={128}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <span className={`auth-field-hint ${password === confirmPassword ? "is-valid" : "is-invalid"}`}>
                  {password === confirmPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                </span>
              )}
            </label>
          )}

          {error && (
            <p className="auth-error" role="alert">
              <Icon name="error" />
              <span>{error}</span>
            </p>
          )}

          <button className="btn auth-submit" disabled={busy} type="submit">
            {busy ? (
              <>
                <span className="spinner" />
                <span>{signup ? "Creating account…" : "Signing in…"}</span>
              </>
            ) : (
              <>
                <span>{signup ? "Create account" : "Sign in"}</span>
                <Icon name="arrow" />
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          {signup ? "Already have an account?" : "New to KannadaMitra?"}{" "}
          <Link href={signup ? "/login" : "/signup"}>
            {signup ? "Sign in" : "Create an account"}
          </Link>
        </p>

        <p className="auth-local-note">
          Secured with encrypted password hashing and HTTP-only session cookies.
        </p>
      </section>
    </main>
  );
}
