"use client";
import { useActionState } from "react";
import { login } from "@/app/actions";

export default function Login() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="wrap narrow">
      <span className="brand"><img src="/go-logo.jpg" alt="" width={28} height={28} />Central Hall</span>
      <h1>Welcome back.</h1>
      <form action={action} className="form">
        <label>Password<input name="password" type="password" required autoFocus /></label>
        {state?.error && <p className="err">{state.error}</p>}
        <button className="btn" disabled={pending} style={{ justifyContent: "center" }}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
