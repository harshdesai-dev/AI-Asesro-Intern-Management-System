"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to sign in.");
      router.replace(data.user.role === "ADMIN" ? "/admin" : "/intern");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page"><div className="login-glow login-glow-a" /><div className="login-glow login-glow-b" /><section className="login-card">
    <div className="login-brand"><span className="brand-mark"><Activity size={20} /></span><div><strong>AI ASESRO</strong><small>INTERNHUB</small></div></div>
    <div className="login-intro"><span className="eyebrow">INTERNAL WORKSPACE</span><h1>Welcome back.</h1><p>Sign in to manage internship work, tasks and team coordination.</p></div>
    <form className="login-form" onSubmit={submit}>
      <label htmlFor="email">Email address</label><div className="input-with-icon"><Mail size={17} /><input id="email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      <label htmlFor="password">Password</label><div className="input-with-icon"><LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
      {error && <div className="alert alert-error">{error}</div>}
      <button className="button button-primary login-submit" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in to workspace"}<ArrowRight size={17} /></button>
    </form>
    <p className="login-foot">Access is provided by your ASESRO administrator.</p>
  </section><footer className="login-footer">AI ASESRO · Internal Internship Management</footer></main>;
}
