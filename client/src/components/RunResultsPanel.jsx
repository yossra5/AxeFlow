// client/src/components/RunResultsPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Slide-in panel shown after clicking "Run Workflow".
// Displays one result card per node that was executed.
//
// PROPS:
//   results   array   — list of result objects from POST /api/execute/workflow
//                       each has: { nodeId, label, type, status, data, error, duration }
//   onClose   function — called when user clicks X to hide the panel
//
// RESULT CARD COLORS:
//   2xx status  → green  (success)
//   4xx status  → orange (client error — wrong URL, auth, etc.)
//   5xx status  → red    (server error)
//   "error"     → red    (network error, timeout, DNS fail)
//   "skipped"   → gray   (node type not yet implemented)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { X, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

// Choose icon and color based on the HTTP status or error string
function getStatusStyle(status) {
  if (status === "error")   return { color: "#f38ba8", icon: XCircle,       label: "Error" };
  if (status === "skipped") return { color: "#888",    icon: AlertCircle,   label: "Skipped" };
  if (status >= 200 && status < 300) return { color: "#4ade80", icon: CheckCircle, label: String(status) };
  if (status >= 400 && status < 500) return { color: "#e06c3a", icon: AlertCircle, label: String(status) };
  return { color: "#f38ba8", icon: XCircle, label: String(status) };
}

// Single result card — collapsible JSON output
function ResultCard({ result }) {
  const [expanded, setExpanded] = useState(true);
  const style = getStatusStyle(result.status);
  const Icon  = style.icon;

  return (
    <div style={{ ...s.card, borderColor: style.color + "44" }}>
      {/* Card header */}
      <div style={s.cardHeader} onClick={() => setExpanded((v) => !v)}>
        <div style={s.cardLeft}>
          <Icon size={15} color={style.color} />
          <span style={{ ...s.cardLabel, color: style.color }}>{style.label}</span>
          <span style={s.cardName}>{result.label}</span>
          <span style={s.cardType}>{result.type}</span>
        </div>
        <div style={s.cardRight}>
          <span style={s.duration}>
            <Clock size={11} style={{ marginRight: 3 }} />
            {result.duration}ms
          </span>
          {expanded ? <ChevronUp size={14} color="#555" /> : <ChevronDown size={14} color="#555" />}
        </div>
      </div>

      {/* Collapsible body — JSON response or error message */}
      {expanded && (
        <div style={s.cardBody}>
          {result.error && result.status === "error" ? (
            <p style={s.errorText}>{result.error}</p>
          ) : (
            <pre style={s.json}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function RunResultsPanel({ results, onClose }) {
  if (!results) return null;

  // Filter out trigger nodes and skipped results (they don't show in n8n)
  const filteredResults = results.filter(r => 
    r.type !== "ManualTrigger" && 
    r.type !== "ScheduleTrigger" && 
    r.status !== "skipped"
  );

  // If no results after filtering, don't show the panel
  if (filteredResults.length === 0) {
    return null;
  }

  const successCount = filteredResults.filter((r) => r.status >= 200 && r.status < 300).length;
  const errorCount   = filteredResults.filter((r) => r.status === "error" || r.status >= 400).length;

  return (
    <div style={s.panel}>
      {/* Panel header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.title}>Run Results</span>
          <span style={s.badge}>{filteredResults.length} node{filteredResults.length !== 1 ? "s" : ""}</span>
          {successCount > 0 && <span style={{ ...s.badge, background: "#1a3a2a", color: "#4ade80" }}>{successCount} ok</span>}
          {errorCount   > 0 && <span style={{ ...s.badge, background: "#3a1a1a", color: "#f38ba8" }}>{errorCount} failed</span>}
        </div>
        <button style={s.closeBtn} onClick={onClose}><X size={15} /></button>
      </div>

      {/* Result cards */}
      <div style={s.list}>
        {filteredResults.map((r) => (
          <ResultCard key={r.nodeId} result={r} />
        ))}
      </div>
    </div>
  );
}

const s = {
  panel: {
    width: 380, background: "#0d0d20",
    borderLeft: "1px solid #2d2d4e",
    display: "flex", flexDirection: "column",
    height: "100%", flexShrink: 0, overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: "1px solid #2d2d4e",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  title:  { fontSize: 13, fontWeight: 600, color: "#e8e8f0" },
  badge: {
    fontSize: 11, padding: "2px 7px",
    background: "#1a1a2e", color: "#666",
    borderRadius: 5,
  },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#555", padding: 3, display: "flex", alignItems: "center",
  },
  list: { flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 },
  card: {
    background: "#13132a", border: "1px solid",
    borderRadius: 8, overflow: "hidden",
  },
  cardHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 12px", cursor: "pointer",
  },
  cardLeft:  { display: "flex", alignItems: "center", gap: 7 },
  cardRight: { display: "flex", alignItems: "center", gap: 8 },
  cardLabel: { fontSize: 12, fontWeight: 700 },
  cardName:  { fontSize: 12, color: "#e8e8f0", fontWeight: 500 },
  cardType:  { fontSize: 10, color: "#444" },
  duration: {
    fontSize: 10, color: "#555",
    display: "flex", alignItems: "center",
  },
  cardBody: {
    borderTop: "1px solid #2d2d4e",
    padding: "10px 12px",
    maxHeight: 220, overflowY: "auto",
  },
  json: {
    margin: 0, fontSize: 11,
    color: "#89b4fa", fontFamily: "monospace",
    whiteSpace: "pre-wrap", wordBreak: "break-all",
  },
  errorText: { margin: 0, fontSize: 12, color: "#f38ba8" },
  empty: { margin: 0, fontSize: 12, color: "#555", textAlign: "center", padding: "20px 0" },
};