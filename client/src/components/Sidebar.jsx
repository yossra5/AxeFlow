// client/src/components/Sidebar.jsx

import React, { useState } from "react";
import { Search, Globe, Bot, MessageSquare, Zap, Clock } from "lucide-react";
import { NODE_CATALOG } from "../data/nodeTypes";
import { useTheme } from "../context/ThemeContext";

const ICON_MAP = { Globe, Bot, MessageSquare, Zap, Clock };

export default function Sidebar({ onAddNode }) {
  const { ui } = useTheme();
  const [search, setSearch] = useState("");

  const filtered = NODE_CATALOG.filter((n) =>
    n.label.toLowerCase().includes(search.toLowerCase()) ||
    n.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map((n) => n.category))];

  const handleDragStart = (e, node) => {
    e.dataTransfer.setData("application/nodeType", JSON.stringify(node));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside style={{ ...s.sidebar, background: ui.sidebar, borderColor: ui.border }}>
      <div style={{ ...s.header, borderColor: ui.border }}>
        <p style={{ ...s.title, color: ui.text }}>Nodes</p>
        <div style={{ ...s.searchWrap, background: ui.surface2, borderColor: ui.border }}>
          <Search size={12} style={{ color: ui.textMuted, flexShrink: 0 }} />
          <input
            style={{ ...s.searchInput, color: ui.text }}
            placeholder="Search nodes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={s.list}>
        {filtered.length === 0 && <p style={{ ...s.empty, color: ui.textMuted }}>No nodes found</p>}

        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <p style={{ ...s.catLabel, color: ui.textHint }}>{cat}</p>
            {filtered.filter((n) => n.category === cat).map((node) => {
              const Icon = ICON_MAP[node.icon] || Globe;
              return (
                <div
                  key={node.type}
                  style={{ ...s.item, borderColor: "transparent" }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, node)}
                  onClick={() => onAddNode(node)}
                  title={node.description}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = ui.surface2;
                    e.currentTarget.style.borderColor = ui.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div style={{ ...s.iconWrap, background: node.color }}>
                    <Icon size={13} color="#fff" />
                  </div>
                  <div>
                    <p style={{ ...s.itemLabel, color: ui.text }}>{node.label}</p>
                    <p style={{ ...s.itemDesc, color: ui.textMuted }}>{node.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ ...s.footer, borderColor: ui.border }}>
        <p style={{ ...s.footerText, color: ui.textHint }}>Click or drag to canvas</p>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width: 220, borderRight: "1px solid",
    display: "flex", flexDirection: "column",
    height: "100%", flexShrink: 0,
  },
  header:     { padding: "14px 12px 10px", borderBottom: "1px solid" },
  title:      { margin: "0 0 9px", fontSize: 12, fontWeight: 600 },
  searchWrap: {
    display: "flex", alignItems: "center",
    border: "1px solid", borderRadius: 6, padding: "5px 8px", gap: 5,
  },
  searchInput: { background: "none", border: "none", fontSize: 12, outline: "none", flex: 1 },
  list:        { flex: 1, overflowY: "auto", padding: "10px 10px" },
  catLabel: {
    margin: "0 0 5px", fontSize: 10, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.07em",
  },
  item: {
    display: "flex", alignItems: "center", gap: 9,
    padding: "7px 8px", borderRadius: 7,
    cursor: "grab", border: "1px solid",
    transition: "background 0.12s, border-color 0.12s", marginBottom: 2,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 6,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  itemLabel: { margin: 0, fontSize: 12, fontWeight: 500 },
  itemDesc:  { margin: 0, fontSize: 10 },
  empty:     { margin: 0, fontSize: 11, textAlign: "center", padding: "16px 0" },
  footer:    { padding: "8px 12px", borderTop: "1px solid" },
  footerText:{ margin: 0, fontSize: 10, textAlign: "center" },
};
