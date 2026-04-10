// client/src/components/Toolbar.jsx

import React, { useState } from "react";
import { Download, Save, ArrowLeft, Workflow, Check, Play, AlertCircle, Sun, Moon, Palette } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Toolbar({
  workflowName, nodeCount,
  onSave, onDownload, onRun, onBack,
  saving, saveStatus, running,
}) {
  const { isDark, toggleMode, canvasTheme, setCanvasTheme, CANVAS_THEMES, ui } = useTheme();
  const [editingName,    setEditingName]    = useState(false);
  const [draft,          setDraft]          = useState(workflowName);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const commitName = () => {
    setEditingName(false);
    if (draft.trim() && draft.trim() !== workflowName) onSave(draft.trim());
  };

  const saveBtnStyle = () => {
    if (saveStatus === "ok")    return { ...s.saveBtn, background: "#1a4a2a", borderColor: "#2e7a3e", color: "#4ade80" };
    if (saveStatus === "error") return { ...s.saveBtn, background: "#4a1a1a", borderColor: "#7a2e2e", color: "#f38ba8" };
    return s.saveBtn;
  };

  const saveBtnContent = () => {
    if (saving)                 return "Saving…";
    if (saveStatus === "ok")    return "✓ Saved!";
    if (saveStatus === "error") return "✗ Failed";
    return "Save";
  };

  return (
    <header style={{ ...s.bar, background: ui.topbar, borderColor: ui.border }}>
      <div style={s.left}>
        <button style={{ ...s.iconBtn, color: ui.textMuted }} onClick={onBack} title="Dashboard">
          <ArrowLeft size={15} />
        </button>
        <div style={{ ...s.logo, background: ui.surface2, borderColor: ui.border }}>
          <Workflow size={16} color="#e06c3a" />
        </div>

        {editingName ? (
          <div style={s.nameEditRow}>
            <input
              style={{ ...s.nameInput, background: ui.surface2, borderColor: "#e06c3a", color: ui.text }}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter")  commitName();
                if (e.key === "Escape") { setDraft(workflowName); setEditingName(false); }
              }}
            />
            <button style={{ ...s.iconBtn, color: "#e06c3a" }} onMouseDown={commitName}>
              <Check size={13} />
            </button>
          </div>
        ) : (
          <span
            style={{ ...s.wfName, color: ui.text, borderBottomColor: ui.border }}
            onClick={() => { setDraft(workflowName); setEditingName(true); }}
            title="Click to rename"
          >
            {workflowName}
          </span>
        )}

        <span style={{ ...s.nodeCount, color: ui.textHint }}>
          {nodeCount} node{nodeCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={s.right}>
        {/* Canvas theme picker */}
        <div style={{ position: "relative" }}>
          <button
            style={{ ...s.iconBtn2, color: ui.textMuted, borderColor: ui.border }}
            onClick={() => setShowThemePicker((v) => !v)}
            title="Canvas background"
          >
            <Palette size={14} />
          </button>

          {showThemePicker && (
            <div style={{ ...s.themePicker, background: ui.surface, borderColor: ui.border }}>
              <p style={{ ...s.themePickerTitle, color: ui.textMuted }}>Canvas Background</p>
              <div style={s.themeGrid}>
                {CANVAS_THEMES.map((t) => (
                  <button
                    key={t.id}
                    title={t.label}
                    onClick={() => { setCanvasTheme(t); setShowThemePicker(false); }}
                    style={{
                      ...s.themeBtn,
                      background: t.bg,
                      boxShadow: canvasTheme.id === t.id ? `0 0 0 2px #e06c3a` : `0 0 0 1px ${ui.border}`,
                    }}
                  >
                    <div style={{ ...s.themeDot, background: t.dot }} />
                    <span style={{ ...s.themeLabel, color: t.bg === "#f8fafc" || t.bg === "#f1f5f9" ? "#334155" : "#aaa" }}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light mode toggle */}
        <button
          style={{ ...s.iconBtn2, color: ui.textMuted, borderColor: ui.border }}
          onClick={toggleMode}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Run */}
        <button
          style={{ ...s.runBtn, opacity: (running || nodeCount === 0) ? 0.5 : 1 }}
          onClick={onRun}
          disabled={running || nodeCount === 0}
          title={nodeCount === 0 ? "Add nodes first" : "Run all nodes in order"}
        >
          <Play size={13} style={{ marginRight: 5 }} />
          {running ? "Running…" : "Run Workflow"}
        </button>

        {/* Save */}
        <button style={{ ...saveBtnStyle(), display: "flex", alignItems: "center" }}
          onClick={() => onSave()} disabled={saving}>
          <Save size={13} style={{ marginRight: 5 }} />
          {saveBtnContent()}
        </button>

        {/* Download */}
        <button style={s.dlBtn} onClick={onDownload} title="Download workflow JSON">
          <Download size={13} style={{ marginRight: 5 }} />
          Export JSON
        </button>
      </div>
    </header>
  );
}

const s = {
  bar: {
    height: 50, borderBottom: "1px solid",
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px", flexShrink: 0, zIndex: 20,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
  },
  left:  { display: "flex", alignItems: "center", gap: 10 },
  right: { display: "flex", gap: 8, alignItems: "center" },
  iconBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 5, borderRadius: 6, display: "flex", alignItems: "center",
  },
  iconBtn2: {
    background: "none", border: "1px solid",
    cursor: "pointer", padding: "5px 8px",
    borderRadius: 6, display: "flex", alignItems: "center",
  },
  logo: {
    width: 30, height: 30, borderRadius: 7, border: "1px solid",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  wfName: {
    fontSize: 14, fontWeight: 600,
    cursor: "text", borderBottom: "1px dashed", paddingBottom: 1,
  },
  nameEditRow: { display: "flex", alignItems: "center", gap: 4 },
  nameInput: {
    border: "1px solid", borderRadius: 5, padding: "3px 8px",
    fontSize: 13, fontWeight: 600, outline: "none",
  },
  nodeCount: { fontSize: 11 },
  runBtn: {
    display: "flex", alignItems: "center",
    background: "#1a2a3a", border: "1px solid #1e4a7a",
    borderRadius: 7, padding: "6px 14px",
    fontSize: 12, color: "#89b4fa", fontWeight: 600,
    cursor: "pointer", transition: "all 0.15s",
  },
  saveBtn: {
    display: "flex", alignItems: "center",
    background: "#1a3a2a", border: "1px solid #1e5c3a",
    borderRadius: 7, padding: "6px 14px",
    fontSize: 12, color: "#4ade80", fontWeight: 500,
    cursor: "pointer", transition: "all 0.3s",
  },
  dlBtn: {
    display: "flex", alignItems: "center",
    background: "none", border: "1px solid #2d2d4e",
    borderRadius: 7, padding: "6px 14px",
    fontSize: 12, color: "#e8e8f0", fontWeight: 500,
    cursor: "pointer",
  },
  // Theme picker dropdown
  themePicker: {
    position: "absolute", top: 38, right: 0,
    border: "1px solid", borderRadius: 10,
    padding: "12px", width: 240, zIndex: 100,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  themePickerTitle: { margin: "0 0 10px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  themeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  themeBtn: {
    border: "none", borderRadius: 8, padding: "8px 10px",
    cursor: "pointer", display: "flex", flexDirection: "column",
    gap: 4, alignItems: "flex-start", transition: "box-shadow 0.15s",
  },
  themeDot: { width: 16, height: 16, borderRadius: 4 },
  themeLabel: { fontSize: 10, fontWeight: 500 },
};
