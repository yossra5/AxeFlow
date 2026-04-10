// client/src/services/WorkflowSerializer.js
// ─────────────────────────────────────────────────────────────────────────────
// Converts React Flow canvas state → the exact JSON schema your supervisor wants.
//
// SUPERVISOR SCHEMA (from the image):
// {
//   "name": "name of orchestration",
//   "version": "version of orchestration",
//   "nodes": [
//     {
//       "uniq_id":     "HTTPRequest",          ← UUID string
//       "type":        "APICall",              ← node type
//       "name":        "HTTP Request",         ← display name (NOT "label")
//       "description": null,                   ← null when empty
//       "parameters": {
//         "base_url":  "",
//         "endpoint":  "",
//         "method":    "",
//         "payload":   {}                      ← plain dict (not nested object)
//       },
//       "nexts": []                            ← list of connected uniq_ids
//     }
//   ],
//   "entry_nodes": [],                         ← IDs of nodes with no inputs
//   "orchestration_response": {                ← what the workflow returns
//     "type": "",
//     "target_nodes": []
//   }
// }
//
// INTERNAL vs EXPORT:
//   Internally (in React Flow state and MongoDB), we store extra fields:
//     - position: { x, y }  — so canvas layout is restored when reopening
//     - payload as { type, fields, json } — for the UI keypair/json toggle
//   On export (downloaded JSON), we strip internal fields and convert payload
//   to a plain dict as the supervisor wants.
//
//   MongoDB stores the FULL internal format (with position + internal payload)
//   so the canvas can be perfectly restored. The download strips it to the clean schema.
// ─────────────────────────────────────────────────────────────────────────────

import { workflowAPI } from "./api";
import { buildPayloadDict } from "../data/nodeTypes";

// ── serializeWorkflow ─────────────────────────────────────────────────────────
// Converts React Flow nodes + edges into the full internal workflow object.
// This is stored in MongoDB (includes position and internal payload format).
// Also used as input to the run workflow endpoint.
export function serializeWorkflow(rfNodes, rfEdges, name = "My Workflow") {
  // Find entry nodes: nodes that no other node points to (root / start nodes)
  const allTargets = new Set(rfEdges.map((e) => e.target));
  const entryNodes = rfNodes
    .filter((n) => !allTargets.has(n.id))
    .map((n) => n.id);

  const nodes = rfNodes.map((node) => {
    // Build nexts: IDs of all nodes this node connects to
    const nexts = rfEdges
      .filter((e) => e.source === node.id)
      .map((e) => e.target);

    return {
      uniq_id:     node.id,
      type:        node.data.type,
      name:        node.data.label,           // supervisor uses "name" not "label"
      description: node.data.description || null,  // null when empty (not "")
      position:    node.position,             // internal — for canvas restore
      parameters:  node.data.parameters || {},
      nexts,
    };
  });

  return {
    name,
    version:    "1.0",
    nodes,
    entry_nodes: entryNodes,
    orchestration_response: {
      type:         "",
      target_nodes: [],
    },
  };
}

// ── exportWorkflow ────────────────────────────────────────────────────────────
// Builds the CLEAN supervisor schema for download.
// Differences from serializeWorkflow:
//   - No "position" field (internal canvas data)
//   - payload converted from { type, fields, json } → plain dict {}
//   - description is null when empty
export function exportWorkflow(rfNodes, rfEdges, name = "My Workflow") {
  const allTargets = new Set(rfEdges.map((e) => e.target));
  const entryNodes = rfNodes
    .filter((n) => !allTargets.has(n.id))
    .map((n) => n.id);

  const nodes = rfNodes.map((node) => {
    const nexts = rfEdges
      .filter((e) => e.source === node.id)
      .map((e) => e.target);

    const params = node.data.parameters || {};

    // Build clean parameters matching supervisor schema
    const cleanParams = {
      base_url: params.base_url || "",
      endpoint: params.endpoint || "",
      method:   params.method   || "",
      payload:  buildPayloadDict(params.payload),  // plain dict: { key: value }
    };

    return {
      uniq_id:     node.id,
      type:        node.data.type,
      name:        node.data.label,
      description: node.data.description || null,
      parameters:  cleanParams,
      nexts,
    };
  });

  return {
    name,
    version:    "1.0",
    nodes,
    entry_nodes:             entryNodes,
    orchestration_response:  { type: "", target_nodes: [] },
  };
}

// ── downloadWorkflow ──────────────────────────────────────────────────────────
// Downloads the clean supervisor schema as a .json file.
export function downloadWorkflow(rfNodes, rfEdges, name) {
  const workflow = exportWorkflow(rfNodes, rfEdges, name);
  const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${(name || "workflow").replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── saveWorkflow ──────────────────────────────────────────────────────────────
// Saves to MongoDB using the FULL internal format (includes position).
// This lets us perfectly restore the canvas layout when reopening.
export async function saveWorkflow(workflowId, rfNodes, rfEdges, name) {
  const data = serializeWorkflow(rfNodes, rfEdges, name);
  const id   = workflowId?._id || workflowId;
  const res  = await workflowAPI.save(id, { name, data });
  return res.data;
}
