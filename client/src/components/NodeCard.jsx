// client/src/components/NodeCard.jsx

import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "reactflow";
import { Globe, Pencil, Check, Bot, MessageSquare, Zap, Clock, CheckCircle, XCircle, Loader } from "lucide-react";
import { NODE_COLORS } from "../data/nodeTypes";

const ICON_MAP = {
  APICall:         Globe,
  AIAgent:         Bot,
  LLMCall:         MessageSquare,
  ScheduleTrigger: Clock,
  ManualTrigger:   Zap,
};

const TRIGGER_TYPES = new Set(["ScheduleTrigger", "ManualTrigger"]);

const TYPE_LABELS = {
  APICall:         "API",
  AIAgent:         "AI",
  LLMCall:         "LLM",
  ScheduleTrigger: "SCHEDULE",
  ManualTrigger:   "MANUAL",
};

const STATUS_STYLES = {
  running: {
    borderColor: "#89b4fa",
    boxShadow:   "0 0 0 2px #89b4fa44, 0 0 16px #89b4fa33",
  },
  ok: {
    borderColor: "#4ade80",
    boxShadow:   "0 0 0 2px #4ade8055, 0 0 16px #4ade8033",
  },
  error: {
    borderColor: "#f38ba8",
    boxShadow:   "0 0 0 2px #f38ba855, 0 0 16px #f38ba833",
  },
};

export default function NodeCard({ data, selected }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(data.label);
  const inputRef              = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitRename = () => {
    if (draft.trim()) data.onRename(data.id, draft.trim());
    else setDraft(data.label);
    setEditing(false);
  };

  const color      = NODE_COLORS[data.type] || "#e06c3a";
  const Icon       = ICON_MAP[data.type]    || Globe;
  const isTrigger  = TRIGGER_TYPES.has(data.type);
  const typeLabel  = TYPE_LABELS[data.type] || data.type;
  const status     = data.status || null;

  const statusStyle = status ? STATUS_STYLES[status] : {};
  const selectedStyle = selected && !status
    ? { borderColor: color, boxShadow: `0 0 0 2px ${color}44, 0 4px 12px rgba(0,0,0,0.3)` }
    : {};

  return (
    <div
      style={{
        ...s.card,
        ...selectedStyle,
        ...statusStyle,
        animation: status === "running" ? "pulse 1s ease-in-out infinite alternate" : "none",
      }}
      onDoubleClick={() => data.onDoubleClick?.(data.id)}
    >
      <style>{`
        @keyframes pulse {
          from { box-shadow: 0 0 0 2px #89b4fa44, 0 0 8px #89b4fa22; }
          to   { box-shadow: 0 0 0 3px #89b4fa77, 0 0 20px #89b4fa44; }
        }
      `}</style>

      {/* ACCENT BAR - Colorful bar on the left side */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        background: color,
        borderRadius: "0 3px 3px 0",
      }} />

      {/* INPUT HANDLE (top) - only for non-triggers */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ ...s.handle, background: color, borderColor: "#0a0a1a" }}
        />
      )}

      {/* TRIGGER BADGE - only for trigger nodes */}
      {isTrigger && (
        <div style={{ ...s.triggerBadge, background: color + "22", color, borderColor: color + "44" }}>
          ⚡
        </div>
      )}

      {/* STATUS ICON - top-right corner (success/error/running) */}
      {status === "ok" && (
        <div style={s.statusBadge}>
          <CheckCircle size={12} color="#4ade80" fill="#0d1f16" />
        </div>
      )}
      {status === "error" && (
        <div style={s.statusBadge}>
          <XCircle size={12} color="#f38ba8" fill="#1f0d0d" />
        </div>
      )}
      {status === "running" && (
        <div style={{ ...s.statusBadge, animation: "spin 0.8s linear infinite" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <Loader size={11} color="#89b4fa" />
        </div>
      )}

      {/* ICON */}
      <div style={{ ...s.iconWrap, background: color }}>
        <Icon size={14} color="#fff" />
      </div>

      {/* NAME & TYPE AREA */}
      <div style={s.nameArea}>
        {editing ? (
          <div style={s.editRow}>
            <input
              ref={inputRef}
              value={draft}
              style={s.nameInput}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setDraft(data.label); setEditing(false); }
              }}
            />
            <button style={s.editBtn} onMouseDown={commitRename}>
              <Check size={10} />
            </button>
          </div>
        ) : (
          <div style={s.nameRow}>
            <span style={s.name}>{data.label}</span>
            <button
              style={s.editBtn}
              onClick={(e) => { e.stopPropagation(); setDraft(data.label); setEditing(true); }}
            >
              <Pencil size={9} />
            </button>
          </div>
        )}
        <span style={s.typeLabel}>{typeLabel}</span>
      </div>

      {/* OUTPUT HANDLE (bottom) - all nodes have this */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...s.handle, background: color, borderColor: "#0a0a1a" }}
      />
    </div>
  );
}

// STYLES - SMALLER & COMPACT
const s = {
  card: {
    // Gradient background
    background: "linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%)",
    border: "1.5px solid #2d2d4e",
    borderRadius: 12,
    padding: "8px 12px",
    minWidth: 150,
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "grab",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
  },
  triggerBadge: {
    position: "absolute",
    top: -8,
    left: 12,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.05em",
    padding: "1px 5px",
    borderRadius: 12,
    border: "1px solid",
  },
  statusBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a1a2e",
    borderRadius: "50%",
    zIndex: 10,
    padding: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nameArea: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  editRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: 600,
    color: "#e8e8f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  typeLabel: {
    fontSize: 9,
    color: "#666",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  nameInput: {
    fontSize: 11,
    fontWeight: 600,
    background: "#12122a",
    border: "1px solid #e06c3a",
    borderRadius: 4,
    padding: "2px 6px",
    color: "#e8e8f0",
    outline: "none",
    width: "100%",
  },
  editBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#555",
    padding: 2,
    display: "flex",
    alignItems: "center",
    borderRadius: 3,
    flexShrink: 0,
  },
  handle: {
    width: 8,
    height: 8,
    border: "2px solid",
  },
};