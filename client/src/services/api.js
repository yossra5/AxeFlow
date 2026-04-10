// client/src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Central Axios instance and all API call functions.
//
// HOW IT WORKS:
//   - We create one axios instance with baseURL "/api" and withCredentials:true
//   - withCredentials means the browser sends the session cookie on every request
//   - The "proxy" in client/package.json forwards /api/* to localhost:5000
//     so we never hardcode the server URL
//
// THREE API GROUPS:
//   authAPI     — register, login, logout, me
//   workflowAPI — list, get, create, save, delete
//   executeAPI  — runNode (single test), runWorkflow (run all nodes)
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";

const api = axios.create({
  baseURL:         "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login",    data),
  logout:   ()     => api.post("/auth/logout"),
  me:       ()     => api.get("/auth/me"),
};

// ── Workflows ─────────────────────────────────────────────────────────────────
export const workflowAPI = {
  // Returns list with only name + dates (no nodes data — keeps it fast)
  list:   ()              => api.get("/workflows"),
  // Returns the FULL workflow including data.nodes — call this before opening editor
  get:    (id)            => api.get(`/workflows/${id}`),
  // Create a new empty workflow
  create: (payload)       => api.post("/workflows", payload),
  // Overwrite a workflow's name and/or data
  save:   (id, payload)   => api.put(`/workflows/${id}`, payload),
  // Delete permanently
  delete: (id)            => api.delete(`/workflows/${id}`),
};

// ── Execute ───────────────────────────────────────────────────────────────────
export const executeAPI = {
  // Test a single node — used by the Test button in HttpRequestModal
  // parameters: { method, url, bodyType, bodyFields, bodyJson, authentication }
  runNode: (parameters) => api.post("/execute", { parameters }),

  // Run all nodes in the workflow in execution order
  // nodes: the serialized nodes array from serializeWorkflow()
  // Returns: { results: [{ nodeId, label, status, data, error, duration }] }
  runWorkflow: (nodes) => api.post("/execute/workflow", { nodes }),
};

export default api;
