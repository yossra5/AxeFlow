// server/routes/execute.js
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/execute          — run a single node (Test button in modal)
// POST /api/execute/workflow — run all nodes in order (Run Workflow button)
//
// SCHEMA HANDLED (supervisor's image):
//   Type = APICall:
//     base_url   str   — root URL e.g. "https://api.example.com"
//     endpoint   str   — path    e.g. "/users" or "/posts/1"
//     method     str   — GET | POST | PUT | PATCH | DELETE
//     payload    dict  — { type: "keypair"|"json", fields: [...], json: "..." }
//     authentication — { type, bearerToken, apiKey, basicAuth }
//
//   Full URL = base_url + endpoint
//   Backward compatible: also accepts old { url: { value } } format
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const axios   = require("axios");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// ── fireRequest ───────────────────────────────────────────────────────────────
// Core function: takes a parameters object and fires the HTTP call.
// Returns { status, statusText, headers, data }
// Supports both new schema (base_url + endpoint) and old schema (url.value)
async function fireRequest(parameters) {
  const { base_url, endpoint, method, payload, authentication,
          url, bodyType, bodyFields, bodyJson } = parameters;

  // Build the full URL
  // New schema: base_url + endpoint
  // Old schema fallback: url.value (for backward compatibility)
  const fullUrl = base_url !== undefined
    ? ((base_url || "") + (endpoint || "")).trim()
    : (url?.value || "");

  if (!method || !fullUrl) {
    throw new Error("method and URL are required.");
  }

  // ── Auth headers ─────────────────────────────────────────────────────────
  const headers = {};
  const auth = authentication || {};

  if (auth.type === "bearerToken" && auth.bearerToken?.token) {
    headers["Authorization"] = `Bearer ${auth.bearerToken.token}`;
  }
  if (auth.type === "apiKey" && auth.apiKey?.in === "header") {
    headers[auth.apiKey.name] = auth.apiKey.value;
  }
  if (auth.type === "basicAuth" && auth.basicAuth) {
    const encoded = Buffer.from(
      `${auth.basicAuth.username}:${auth.basicAuth.password}`
    ).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }

  // ── Query params (API key in query string) ────────────────────────────────
  const params = {};
  if (auth.type === "apiKey" && auth.apiKey?.in === "query") {
    params[auth.apiKey.name] = auth.apiKey.value;
  }

  // ── Request body ──────────────────────────────────────────────────────────
  // New schema: payload = { type, fields, json }
  // Old schema fallback: bodyType, bodyFields, bodyJson
  let data = undefined;
  const hasBody = ["POST", "PUT", "PATCH"].includes(method.toUpperCase());

  if (hasBody) {
    // New schema
    if (payload) {
      if (payload.type === "keypair" && Array.isArray(payload.fields)) {
        data = {};
        for (const f of payload.fields) {
          if (f.key) data[f.key] = f.value;
        }
        headers["Content-Type"] = "application/json";
      } else if (payload.type === "json" && payload.json) {
        data = JSON.parse(payload.json);
        headers["Content-Type"] = "application/json";
      }
    }
    // Old schema fallback
    else if (bodyType === "keypair" && Array.isArray(bodyFields)) {
      data = {};
      for (const f of bodyFields) {
        if (f.key) data[f.key] = f.value;
      }
      headers["Content-Type"] = "application/json";
    } else if (bodyType === "json" && bodyJson) {
      data = JSON.parse(bodyJson);
      headers["Content-Type"] = "application/json";
    }
  }

  // ── Fire ──────────────────────────────────────────────────────────────────
  const response = await axios({
    method:         method.toLowerCase(),
    url:            fullUrl,
    headers,
    params,
    data,
    timeout:        15000,
    validateStatus: () => true,
  });

  return {
    status:     response.status,
    statusText: response.statusText,
    headers:    response.headers,
    data:       response.data,
  };
}

// ── POST /api/execute — single node ──────────────────────────────────────────
router.post("/", async (req, res) => {
  const { parameters } = req.body;
  if (!parameters) return res.status(400).json({ error: "parameters are required." });
  try {
    const result = await fireRequest(parameters);
    return res.json(result);
  } catch (err) {
    console.error("[execute single]", err.message);
    return res.status(502).json({ error: "Request failed.", message: err.message });
  }
});

// ── POST /api/execute/workflow — run all nodes ────────────────────────────────
// Receives the nodes array from serializeWorkflow().
// Runs them in BFS order following nexts connections.
router.post("/workflow", async (req, res) => {
  const { nodes } = req.body;
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ error: "nodes array is required." });
  }

  // Build id → node map
  const nodeMap = {};
  for (const n of nodes) nodeMap[n.uniq_id] = n;

  // Find root nodes (not pointed to by any other node)
  const pointedAt = new Set();
  for (const n of nodes) {
    for (const id of (n.nexts || [])) pointedAt.add(id);
  }
  const roots = nodes.filter((n) => !pointedAt.has(n.uniq_id));
  const startNodes = roots.length > 0 ? roots : nodes;

  // BFS execution order
  const visited = new Set();
  const queue   = [...startNodes];
  const order   = [];
  while (queue.length > 0) {
    const node = queue.shift();
    if (visited.has(node.uniq_id)) continue;
    visited.add(node.uniq_id);
    order.push(node);
    for (const nextId of (node.nexts || [])) {
      if (nodeMap[nextId] && !visited.has(nextId)) queue.push(nodeMap[nextId]);
    }
  }

  // Execute each node in order
  const results = [];
  for (const node of order) {
    const start  = Date.now();
    const result = { nodeId: node.uniq_id, label: node.label, type: node.type,
                     status: null, data: null, error: null, duration: null };
    try {
      if (node.type !== "APICall") {
        result.status = "skipped";
        result.error  = `Node type "${node.type}" execution not yet implemented.`;
      } else {
        const response = await fireRequest(node.parameters);
        result.status  = response.status;
        result.data    = response.data;
      }
    } catch (err) {
      result.status = "error";
      result.error  = err.message;
    }
    result.duration = Date.now() - start;
    results.push(result);
  }

  return res.json({ results });
});

module.exports = router;
