// client/src/pages/AuthPage.jsx
// Single page handling both Login and Register tabs.

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Workflow } from "lucide-react";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab]         = useState("login");
  const [form, setForm]       = useState({ username: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(form.username, form.password);
      } else {
        if (!form.email) { setError("Email is required."); setLoading(false); return; }
        await register(form.username, form.email, form.password);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoIcon}><Workflow size={22} color="#e06c3a" /></div>
          <span style={s.logoText}>AxeFlow</span>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {["login", "register"].map((t) => (
            <button
              key={t}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
              onClick={() => { setTab(t); setError(""); }}
            >
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Username</label>
            <input
              style={s.input}
              placeholder="your_username"
              value={form.username}
              onChange={set("username")}
              required
              autoComplete="username"
            />
          </div>

          {tab === "register" && (
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                style={s.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Password {tab === "register" && <span style={s.hint}>(min 6 characters)</span>}</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              required
              minLength={6}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button style={{ ...s.submit, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={s.switchText}>
          {tab === "login" ? "No account? " : "Already registered? "}
          <span style={s.switchLink} onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}>
            {tab === "login" ? "Register" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", background: "#0a0a1a",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: "#13132a", border: "1px solid #2d2d4e",
    borderRadius: 14, padding: "32px 36px",
    width: 380, maxWidth: "92vw",
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    marginBottom: 28, justifyContent: "center",
  },
  logoIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: "#1a1a2e", border: "1px solid #2d2d4e",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 20, fontWeight: 700, color: "#e8e8f0" },
  tabs: {
    display: "flex", background: "#0d0d20",
    border: "1px solid #2d2d4e", borderRadius: 8,
    overflow: "hidden", marginBottom: 24,
  },
  tab: {
    flex: 1, background: "none", border: "none",
    padding: "9px 0", fontSize: 13, cursor: "pointer",
    color: "#666", transition: "all 0.15s",
  },
  tabActive: { background: "#1a1a2e", color: "#e06c3a", fontWeight: 600 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 500, color: "#888" },
  hint:  { fontWeight: 400, color: "#555" },
  input: {
    background: "#0d0d20", border: "1px solid #2d2d4e",
    borderRadius: 7, padding: "9px 12px",
    fontSize: 13, color: "#e8e8f0", outline: "none",
    fontFamily: "inherit",
  },
  error: {
    margin: 0, fontSize: 12, color: "#f38ba8",
    background: "rgba(243,139,168,0.08)",
    border: "1px solid rgba(243,139,168,0.2)",
    borderRadius: 6, padding: "8px 12px",
  },
  submit: {
    background: "#e06c3a", border: "none",
    borderRadius: 8, padding: "11px",
    fontSize: 14, fontWeight: 600, color: "#fff",
    cursor: "pointer", marginTop: 4, transition: "opacity 0.15s",
    fontFamily: "inherit",
  },
  switchText: { margin: "16px 0 0", fontSize: 12, color: "#555", textAlign: "center" },
  switchLink: { color: "#e06c3a", cursor: "pointer", fontWeight: 500 },
};
