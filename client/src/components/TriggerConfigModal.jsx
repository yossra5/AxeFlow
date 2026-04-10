// client/src/components/TriggerConfigModal.jsx
// Opens when user double-clicks a ScheduleTrigger or ManualTrigger node.
// Each trigger type shows its own config form.

import React, { useState } from "react";
import { X, Clock, Zap } from "lucide-react";

const ICON_MAP  = { ScheduleTrigger: Clock, ManualTrigger: Zap };
const COLOR_MAP = { ScheduleTrigger: "#3b82f6", ManualTrigger: "#10b981" };

export default function TriggerConfigModal({ node, onSave, onClose }) {
  const p = node.data.parameters || {};
  const [config, setConfig] = useState({ ...p });

  const set = (key, val) => setConfig((c) => ({ ...c, [key]: val }));

  const Icon  = ICON_MAP[node.data.type]  || Clock;
  const color = COLOR_MAP[node.data.type] || "#3b82f6";

  const handleSave = () => onSave(config);

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.hLeft}>
            <div style={{ ...s.icon, background: color }}>
              <Icon size={16} color="#fff" />
            </div>
            <div>
              <p style={s.hTitle}>{node.data.label}</p>
              <p style={s.hSub}>{node.data.type} Node</p>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}><X size={17} /></button>
        </div>

        {/* Body */}
        <div style={s.body}>

          {/* ── Schedule Trigger ── */}
          {node.data.type === "ScheduleTrigger" && <>
            <div style={s.field}>
              <label style={s.label}>Interval</label>
              <select style={s.select} value={config.interval || "hourly"}
                onChange={(e) => set("interval", e.target.value)}>
                <option value="every-minute">Every minute</option>
                <option value="every-5-minutes">Every 5 minutes</option>
                <option value="every-15-minutes">Every 15 minutes</option>
                <option value="every-30-minutes">Every 30 minutes</option>
                <option value="hourly">Every hour</option>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
              </select>
            </div>

            {config.interval === "daily" && (
              <div style={s.field}>
                <label style={s.label}>Time (UTC)</label>
                <input type="time" style={s.input}
                  value={config.time || "09:00"}
                  onChange={(e) => set("time", e.target.value)} />
              </div>
            )}

            <div style={s.field}>
              <label style={s.checkRow}>
                <input type="checkbox"
                  checked={config.enabled !== false}
                  onChange={(e) => set("enabled", e.target.checked)} />
                <span style={s.label}>Enabled</span>
              </label>
              <p style={s.hint}>When disabled, this trigger will not fire automatically.</p>
            </div>

            {/* Summary */}
            <div style={s.summary}>
              <p style={s.summaryText}>
                This workflow will run <strong>{config.interval || "hourly"}</strong>
                {config.interval === "daily" ? ` at ${config.time || "09:00"} UTC` : ""}.
                Status: <span style={{ color: config.enabled !== false ? "#4ade80" : "#f38ba8" }}>
                  {config.enabled !== false ? "Active" : "Disabled"}
                </span>
              </p>
            </div>
          </>}

          {/* ── Manual Trigger ── */}
          {node.data.type === "ManualTrigger" && <>
            <div style={s.field}>
              <label style={s.label}>Button Label</label>
              <input type="text" style={s.input}
                value={config.buttonLabel || "Run Workflow"}
                onChange={(e) => set("buttonLabel", e.target.value)}
                placeholder="Run Workflow" />
              <p style={s.hint}>Text shown on the run button in the toolbar.</p>
            </div>

           {/* ── Confirmations ── */}  
      {/* 
            <div style={s.field}>
              <label style={s.checkRow}>
                <input type="checkbox"
                  checked={config.requiresConfirmation !== false}
                  onChange={(e) => set("requiresConfirmation", e.target.checked)} />
                <span style={s.label}>Ask for confirmation before running</span>
              </label>
            </div>
        */}

            

            <div style={s.summary}>
              <p style={s.summaryText}>
                This workflow starts manually when you click <strong>"{config.buttonLabel || "Run Workflow"}"</strong>.
                {config.requiresConfirmation !== false ? " A confirmation dialog will appear first." : ""}
              </p>
            </div>
          </>}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.saveBtn}   onClick={handleSave}>Save Node</button>
        </div>
      </div>
    </div>
  );s
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "#13132a", border: "1px solid #2d2d4e",
    borderRadius: 12, width: 480, maxWidth: "95vw",
    maxHeight: "85vh", display: "flex", flexDirection: "column",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: "1px solid #2d2d4e",
  },
  hLeft: { display: "flex", alignItems: "center", gap: 11 },
  icon: {
    width: 34, height: 34, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  hTitle:   { margin: 0, fontSize: 14, fontWeight: 600, color: "#e8e8f0" },
  hSub:     { margin: 0, fontSize: 11, color: "#555" },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#555", padding: 4, borderRadius: 6, display: "flex",
  },
  body: {
    flex: 1, overflowY: "auto", padding: "20px",
    display: "flex", flexDirection: "column", gap: 18,
  },
  field:    { display: "flex", flexDirection: "column", gap: 7 },
  checkRow: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
  label:    { fontSize: 12, fontWeight: 500, color: "#999" },
  hint:     { margin: 0, fontSize: 11, color: "#444" },
  select: {
    background: "#0d0d20", border: "1px solid #2d2d4e",
    borderRadius: 6, padding: "8px 12px",
    fontSize: 12, color: "#e8e8f0", cursor: "pointer", outline: "none",
  },
  input: {
    background: "#0d0d20", border: "1px solid #2d2d4e",
    borderRadius: 6, padding: "8px 12px",
    fontSize: 12, color: "#e8e8f0", outline: "none",
    fontFamily: "inherit",
  },
  summary: {
    background: "#0a0a18", border: "1px solid #1e1e3a",
    borderRadius: 8, padding: "12px 14px",
  },
  summaryText: { margin: 0, fontSize: 12, color: "#888", lineHeight: 1.6 },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 8,
    padding: "12px 18px", borderTop: "1px solid #2d2d4e",
  },
  cancelBtn: {
    background: "none", border: "1px solid #2d2d4e",
    borderRadius: 7, padding: "7px 18px",
    fontSize: 12, color: "#666", cursor: "pointer",
  },
  saveBtn: {
    background: "#e06c3a", border: "none",
    borderRadius: 7, padding: "7px 22px",
    fontSize: 12, color: "#fff", fontWeight: 600, cursor: "pointer",
  },
};
