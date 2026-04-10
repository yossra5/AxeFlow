// client/src/pages/EditorPage.jsx

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  ReactFlowProvider, useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import Toolbar             from "../components/Toolbar";
import Sidebar             from "../components/Sidebar";
import NodeCard            from "../components/NodeCard";
import HttpRequestModal    from "../components/HttpRequestModal";
import TriggerConfigModal  from "../components/TriggerConfigModal";
import RunResultsPanel     from "../components/RunResultsPanel";

import { validateName, getOtherNames } from "../services/ValidateName";
import { saveWorkflow, downloadWorkflow, serializeWorkflow } from "../services/WorkflowSerializer";
import { executeAPI } from "../services/api";
import { getDefaultParams, NODE_COLORS, API_NODE_TYPES, TRIGGER_NODE_TYPES } from "../data/nodeTypes";
import { useTheme } from "../context/ThemeContext";
import { generateNodeId as uuid } from "../services/uuid";
import CustomEdge from "../components/CustomEdge";



// Defined outside so React Flow doesn't re-register on every render
const nodeTypes = { custom: NodeCard };

// Add edgeTypes object (near nodeTypes)
const edgeTypes = {
  custom: CustomEdge,
};

// ── hydrateNodes ──────────────────────────────────────────────────────────────
function hydrateNodes(savedNodes, onRename, onDoubleClick) {
  if (!savedNodes?.length) return [];
  return savedNodes.map((n) => ({
    id:       n.uniq_id,
    type:     "custom",
    position: n.position || { x: 100, y: 100 },
    data: {
      id:            n.uniq_id,
      type:          n.type,
      label:         n.name || n.label || "Node",
      description:   n.description || "",
      parameters:    n.parameters  || {},
      nexts:         n.nexts       || [],
      onRename,
      onDoubleClick,
    },
  }));
}
function hydrateEdges(savedNodes) {
  if (!savedNodes?.length) return [];
  const edges = [];
  for (const n of savedNodes) {
    // Get the color for this node type
    const nodeColor = NODE_COLORS[n.type] || "#e06c3a";
    
    for (const targetId of (n.nexts || [])) {
      edges.push({
        id:       `e-${n.uniq_id}-${targetId}`,
        source:   n.uniq_id,
        target:   targetId,
        type:     "custom",
        animated: true,
        style:    { stroke: nodeColor, strokeWidth: 2 },  // ← DYNAMIC COLOR
        data:     {},
      });
    }
  }
  return edges;
}

// ── getEdgeColor ──────────────────────────────────────────────────────────────
// Edges get the color of their source node type
function getEdgeColor(sourceNodeId, nodes) {
  const node = nodes.find((n) => n.id === sourceNodeId);
  return node ? (NODE_COLORS[node.data.type] || "#e06c3a") : "#e06c3a";
}

export default function EditorPage({ workflow, onBack }) {
  return (
    <ReactFlowProvider>
      <EditorInner workflow={workflow} onBack={onBack} />
    </ReactFlowProvider>
  );
}

function EditorInner({ workflow, onBack }) {
  const { screenToFlowPosition } = useReactFlow();
  const { canvasTheme, ui }      = useTheme();

  const [wfName,     setWfName]     = useState(workflow.name || "My Workflow");
  const [modalNode,  setModalNode]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [running,    setRunning]    = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState({}); // { nodeId: "running"|"ok"|"error" }


  // ── Rename handler ─────────────────────────────────────────────────────────
  const handleRename = useCallback((nodeId, newName) => {
    setNodes((nds) => {
      const validated = validateName(newName, getOtherNames(nds, nodeId));
      return nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label: validated } } : n
      );
    });
  }, []);

  // ── Double-click: open correct modal based on node type ───────────────────
  // APICall → HttpRequestModal
  // ScheduleTrigger / ManualTrigger → TriggerConfigModal
  // AIAgent / LLMCall → placeholder (coming soon)
  const handleDoubleClick = useCallback((nodeId) => {
    setNodes((nds) => {
      const found = nds.find((n) => n.id === nodeId);
      if (found) setModalNode({ ...found, data: { ...found.data } });
      return nds;
    });
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(() =>
    hydrateNodes(workflow.data?.nodes, handleRename, handleDoubleClick)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(() =>
    hydrateEdges(workflow.data?.nodes)
  );

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, onRename: handleRename, onDoubleClick: handleDoubleClick },
      }))
    );
  }, [handleRename, handleDoubleClick, setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: nodeStatuses[n.id] || null },
      }))
    );
  }, [nodeStatuses, setNodes]);

  // ── Build node ─────────────────────────────────────────────────────────────
  const buildNode = useCallback((catalog, position) => {
    const id = uuid(catalog.label);
    return {
      id, type: "custom", position,
      data: {
        id,
        type:          catalog.type,
        label:         catalog.label,
        description:   "",
        parameters:    getDefaultParams(catalog.type),
        nexts:         [],
        onRename:      handleRename,
        onDoubleClick: handleDoubleClick,
      },
    };
  }, [handleRename, handleDoubleClick]);

  // ── Add node ───────────────────────────────────────────────────────────────
  const addNode = useCallback((catalog, pos) => {
    const position = pos || { x: 160 + Math.random() * 200, y: 120 + Math.random() * 200 };
    setNodes((nds) => {
      const label = validateName(catalog.label, nds.map((n) => n.data.label));
      const node  = buildNode({ ...catalog, label }, position);
      node.data.label = label;
      return [...nds, node];
    });
  }, [buildNode, setNodes]);

  // ── Drop from sidebar ──────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/nodeType");
    if (!raw) return;
    const catalog  = JSON.parse(raw);
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(catalog, position);
  }, [screenToFlowPosition, addNode]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // ── Connect — edge color matches source node type ──────────────────────────
  const onConnect = useCallback((params) => {
    setNodes((nds) => {
      const color = getEdgeColor(params.source, nds);
      setEdges((eds) => addEdge({
        ...params,
        type: "custom",  // ← ADD THIS to use custom edge
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
        data: { onDelete: handleDeleteEdge },   // ← this is what was missing
      }, eds));
      return nds;
    });
  }, [setNodes, setEdges]);
  // AFTER — adds onDelete callback into edge data:
const handleDeleteEdge = useCallback((edgeId) => {
  setEdges((eds) => eds.filter((e) => e.id !== edgeId));
}, [setEdges]);

// Add this after the handleDeleteEdge declaration:
useEffect(() => {
  setEdges((eds) =>
    eds.map((e) => ({
      ...e,
      data: { ...e.data, onDelete: handleDeleteEdge },
    }))
  );
}, [handleDeleteEdge, setEdges]);


  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (newName) => {
    setSaving(true); setSaveStatus(null);
    const name = typeof newName === "string" ? newName : wfName;
    if (typeof newName === "string") setWfName(newName);
    try {
      const wfId = workflow._id || workflow.id;
      await saveWorkflow(wfId, nodes, edges, name);
      setSaveStatus("ok");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error("[save]", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [workflow._id, workflow.id, nodes, edges, wfName]);

  useEffect(() => {
    const timer = setInterval(() => handleSave(), 30_000);
    return () => clearInterval(timer);
  }, [handleSave]);

// ── Run ────────────────────────────────────────────────────────────────────
const handleRun = useCallback(async () => {
  if (nodes.length === 0) return;
  setRunning(true);
  setRunResults(null);
  setNodeStatuses({});  // clear previous highlights

  try {
    const serialized = serializeWorkflow(nodes, edges, wfName);

    // Get all trigger node IDs
    const triggerNodeIds = nodes
      .filter(n => n.data.type === "ManualTrigger" || n.data.type === "ScheduleTrigger")
      .map(n => n.id);

    // Mark ALL nodes as "running" first
    const initialStatus = {};
    for (const n of serialized.nodes) {
      initialStatus[n.uniq_id] = "running";
    }
    setNodeStatuses(initialStatus);

    // Small delay to show running state
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mark trigger nodes as "ok" (green) immediately
    const triggerStatus = {};
    for (const triggerId of triggerNodeIds) {
      triggerStatus[triggerId] = "ok";
    }
    setNodeStatuses(prev => ({ ...prev, ...triggerStatus }));

    // Execute the workflow
    const res = await executeAPI.runWorkflow(serialized.nodes);
    const results = res.data.results || [];

    // Animate non-trigger results
    const nonTriggerResults = results.filter(r => !triggerNodeIds.includes(r.nodeId));
    
    for (let i = 0; i < nonTriggerResults.length; i++) {
      const r = nonTriggerResults[i];
      await new Promise((resolve) => setTimeout(resolve, 300));
      setNodeStatuses((prev) => ({
        ...prev,
        [r.nodeId]: r.status >= 200 && r.status < 300 ? "ok" : "error",
      }));
    }

    setRunResults(results);
  } catch (err) {
    console.error("[run]", err);
    // Mark all as error on total failure
    const errStatus = {};
    for (const n of nodes) errStatus[n.id] = "error";
    setNodeStatuses(errStatus);
    setRunResults([{
      nodeId: "error", label: "Run failed", type: "",
      status: "error", data: null,
      error: err.response?.data?.error || err.message, duration: 0,
    }]);
  } finally {
    setRunning(false);
    // Clear highlights after 4 seconds
    setTimeout(() => setNodeStatuses({}), 4000);
  }
}, [nodes, edges, wfName]);

  const handleDownload = useCallback(() => downloadWorkflow(nodes, edges, wfName), [nodes, edges, wfName]);

  // ── Modal save — updates the correct node's parameters ────────────────────
  const handleModalSave = useCallback((newParams) => {
    if (!modalNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === modalNode.id ? { ...n, data: { ...n.data, parameters: newParams } } : n
      )
    );
    setModalNode(null);
  }, [modalNode, setNodes]);

  // ── MiniMap: each node type gets its own color ────────────────────────────
  const minimapNodeColor = useCallback((node) => {
    return NODE_COLORS[node.data?.type] || "#e06c3a";
  }, []);

  // ── Decide which modal to show ─────────────────────────────────────────────
  const renderModal = () => {
    if (!modalNode) return null;
    const type = modalNode.data.type;

    if (API_NODE_TYPES.has(type)) {
      return <HttpRequestModal node={modalNode} onSave={handleModalSave} onClose={() => setModalNode(null)} />;
    }
    if (TRIGGER_NODE_TYPES.has(type)) {
      return <TriggerConfigModal node={modalNode} onSave={handleModalSave} onClose={() => setModalNode(null)} />;
    }
    // AIAgent, LLMCall — placeholder modal
    return (
      <div style={placeholderModal.overlay} onClick={() => setModalNode(null)}>
        <div style={placeholderModal.box} onClick={(e) => e.stopPropagation()}>
          <p style={placeholderModal.title}>{modalNode.data.label}</p>
          <p style={placeholderModal.sub}>{type} configuration — coming soon</p>
          <button style={placeholderModal.btn} onClick={() => setModalNode(null)}>Close</button>
        </div>
      </div>
    );
  };

  const canvasBg = canvasTheme.bg;

  return (
    <div style={{ ...s.page, background: ui.bg }}>
      <Toolbar
        workflowName={wfName}
        nodeCount={nodes.length}
        onSave={handleSave}
        onDownload={handleDownload}
        onRun={handleRun}
        onBack={onBack}
        saving={saving}
        saveStatus={saveStatus}
        running={running}
      />

      <div style={s.main}>
        <Sidebar onAddNode={addNode} />

        <div style={s.canvas}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}  // ← ADD THIS FOR THE BAN WHEN CONNECTING NODE APPEARS
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            deleteKeyCode="Delete"
            style={{ background: canvasBg }}
          >
            <Background
              color={canvasTheme.dot}
              gap={24}
              size={canvasTheme.type === "lines" ? 0.5 : 1.2}
              variant={canvasTheme.type === "lines" ? "lines" : "dots"}
            />
            <Controls style={{ background: ui.surface, border: `1px solid ${ui.border}`, borderRadius: 8, overflow: "hidden" }} />
            {/* MiniMap: nodeColor function gives each type its own color */}
            <MiniMap
              nodeColor={minimapNodeColor}
              maskColor="rgba(0,0,0,0.4)"
              style={{ background: ui.surface, border: `1px solid ${ui.border}`, borderRadius: 8 }}
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div style={s.empty}>
              <p style={{ ...s.emptyTitle, color: ui.textHint }}>Canvas is empty</p>
              <p style={{ ...s.emptyHint, color: ui.textHint }}>← Drag or click a node from the sidebar</p>
            </div>
          )}
        </div>

        {runResults !== null && (
          <RunResultsPanel results={runResults} onClose={() => setRunResults(null)} />
        )}
      </div>

      {renderModal()}
    </div>
  );
}

const s = {
  page:   { height: "100vh", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  main:   { flex: 1, display: "flex", overflow: "hidden" },
  canvas: { flex: 1, position: "relative" },
  empty:  { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" },
  emptyTitle: { margin: "0 0 6px", fontSize: 17, fontWeight: 600 },
  emptyHint:  { margin: 0, fontSize: 12 },
};

const placeholderModal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  box:     { background: "#13132a", border: "1px solid #2d2d4e", borderRadius: 12, padding: "32px 40px", textAlign: "center" },
  title:   { margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "#e8e8f0" },
  sub:     { margin: "0 0 24px", fontSize: 13, color: "#555" },
  btn:     { background: "#e06c3a", border: "none", borderRadius: 7, padding: "8px 24px", fontSize: 13, color: "#fff", fontWeight: 600, cursor: "pointer" },
};
