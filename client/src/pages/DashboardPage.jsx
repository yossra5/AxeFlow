// client/src/pages/DashboardPage.jsx
// Shows list of saved workflows. Create new, open, or delete.

import React, { useEffect, useState } from "react";
import { workflowAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, Workflow, LogOut, Clock } from "lucide-react";

export default function DashboardPage({ onOpen }) {
  const { user, logout } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);

  useEffect(() => {
    workflowAPI.list()
      .then((r) => setWorkflows(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await workflowAPI.create({ name: "New Workflow", data: { nodes: [], edges: [] } });
      onOpen(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this workflow?")) return;
    await workflowAPI.delete(id);
    setWorkflows((wf) => wf.filter((w) => w._id !== id));
  };

  return (
    <div style={s.page}>
      {/* Top bar */}
      <header style={s.bar}>
        <div style={s.barLeft}>
          <div style={s.logoIcon}><Workflow size={18} color="#e06c3a" /></div>
          <span style={s.logoText}>AxeFlow</span>
        </div>
        <div style={s.barRight}>
          <span style={s.username}>@{user?.username}</span>
          <button style={s.iconBtn} onClick={logout} title="Log out">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.topRow}>
          <h1 style={s.heading}>My Workflows</h1>
          <button style={s.createBtn} onClick={handleCreate} disabled={creating}>
            <Plus size={15} style={{ marginRight: 6 }} />
            {creating ? "Creating…" : "New Workflow"}
          </button>
        </div>

        {loading && <p style={s.muted}>Loading…</p>}

        {!loading && workflows.length === 0 && (
          <div style={s.empty}>
            <Workflow size={40} color="#2d2d4e" />
            <p style={s.emptyTitle}>No workflows yet</p>
            <p style={s.muted}>Create your first workflow to get started.</p>
          </div>
        )}

        <div style={s.grid}>
          {workflows.map((wf) => (
            <div key={wf._id} style={s.card} onClick={() => onOpen(wf)}>
              <div style={s.cardIcon}><Workflow size={20} color="#e06c3a" /></div>
              <div style={s.cardBody}>
                <p style={s.cardName}>{wf.name}</p>
                <p style={s.cardDate}>
                  <Clock size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  {new Date(wf.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                style={s.deleteBtn}
                onClick={(e) => handleDelete(wf._id, e)}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#0a0a1a", color: "#e8e8f0", fontFamily: "inherit" },
  bar: {
    height: 52, background: "#0d0d20",
    borderBottom: "1px solid #2d2d4e",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "0 24px",
  },
  barLeft:  { display: "flex", alignItems: "center", gap: 10 },
  barRight: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: "#1a1a2e", border: "1px solid #2d2d4e",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 16, fontWeight: 700, color: "#e8e8f0" },
  username: { fontSize: 13, color: "#666" },
  iconBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#555", padding: 6, borderRadius: 6,
    display: "flex", alignItems: "center",
  },
  main: { maxWidth: 900, margin: "0 auto", padding: "40px 24px" },
  topRow: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: 28,
  },
  heading: { margin: 0, fontSize: 22, fontWeight: 700, color: "#e8e8f0" },
  createBtn: {
    display: "flex", alignItems: "center",
    background: "#e06c3a", border: "none",
    borderRadius: 8, padding: "9px 18px",
    fontSize: 13, fontWeight: 600, color: "#fff",
    cursor: "pointer",
  },
  muted: { color: "#555", fontSize: 13, margin: 0 },
  empty: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 10,
    padding: "60px 0", textAlign: "center",
  },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: "#444" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 14,
  },
  card: {
    background: "#13132a", border: "1px solid #2d2d4e",
    borderRadius: 10, padding: "16px",
    display: "flex", alignItems: "center", gap: 12,
    cursor: "pointer", transition: "border-color 0.15s",
    position: "relative",
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 9,
    background: "#1a1a2e", border: "1px solid #2d2d4e",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: {
    margin: "0 0 4px", fontSize: 14, fontWeight: 600,
    color: "#e8e8f0",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  cardDate: {
    margin: 0, fontSize: 11, color: "#555",
    display: "flex", alignItems: "center",
  },
  deleteBtn: {
    background: "none", border: "none",
    cursor: "pointer", color: "#444",
    padding: 6, borderRadius: 6,
    display: "flex", alignItems: "center",
    flexShrink: 0,
  },
};
