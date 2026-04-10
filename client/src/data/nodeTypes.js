// client/src/data/nodeTypes.js
// Single source of truth for all node types.
// Add new types here — sidebar, canvas, modals, JSON export all update automatically.

export const NODE_CATALOG = [
    // ── Triggers ────────────────────────────────────────────────────────────────
    {
        type: "ScheduleTrigger",
        label: "Schedule Trigger",
        description: "Run workflow on a schedule",
        color: "#3b82f6",
        icon: "Clock",
        category: "Triggers",
        hasInput: false, // trigger nodes have no incoming connections
        hasOutput: true,
    },
    {
        type: "ManualTrigger",
        label: "Manual Trigger",
        description: "Start workflow manually",
        color: "#00cc66",
        icon: "Zap",
        category: "Triggers",
        hasInput: false,
        hasOutput: true,
    },
    // ── Actions ─────────────────────────────────────────────────────────────────
    {
        type: "APICall",
        label: "API Call",
        description: "Make HTTP calls to any API endpoint",
        color: "#e06c3a",
        icon: "Globe",
        category: "Actions",
        hasInput: true,
        hasOutput: true,
    },
    // ── AI ──────────────────────────────────────────────────────────────────────
    {
        type: "AIAgent",
        label: "AI Agent",
        description: "Intelligent task automation",
        color: " #ac00e6",
        icon: "Bot",
        category: "AI",
        hasInput: true,
        hasOutput: true,
    },
    {
        type: "LLMCall",
        label: "LLM Basic Chain",
        description: "Call a language model directly",
        color: "#e6b800",
        icon: "MessageSquare",
        category: "AI",
        hasInput: true,
        hasOutput: true,
    },
];

// Color lookup by type — used in MiniMap, NodeCard, edges
export const NODE_COLORS = {
    ScheduleTrigger: "#3b82f6",
    ManualTrigger: "#00cc66",
    APICall: "#e06c3a",
    AIAgent: " #ac00e6",
    LLMCall: " #e6b800",
};

// Which node types open the HttpRequestModal on double-click
export const API_NODE_TYPES = new Set(["APICall"]);

// Which node types open the TriggerConfigModal on double-click
export const TRIGGER_NODE_TYPES = new Set(["ScheduleTrigger", "ManualTrigger"]);

// Default parameters per type
export const APICALL_DEFAULTS = {
    base_url: "",
    endpoint: "",
    url_mode: "fixed",
    method: "GET",
    payload: { type: "keypair", fields: [], json: "" },
    authentication: { type: "none" },
};

export const SCHEDULE_TRIGGER_DEFAULTS = {
    interval: "hourly",
    time: "09:00",
    enabled: true,
};

export const MANUAL_TRIGGER_DEFAULTS = {
    requiresConfirmation: true,
    buttonLabel: "Run Workflow",
};

export const AIAGENT_DEFAULTS = {
    model: "gpt-4",
    system: "",
    prompt: "",
    temperature: 0.7,
};

export const LLMCALL_DEFAULTS = {
    provider: "openai",
    model: "gpt-4",
    prompt: "",
    temperature: 0.7,
};

export function getDefaultParams(type) {
    switch (type) {
        case "APICall":
            return {...APICALL_DEFAULTS, payload: {...APICALL_DEFAULTS.payload, fields: [] } };
        case "ScheduleTrigger":
            return {...SCHEDULE_TRIGGER_DEFAULTS };
        case "ManualTrigger":
            return {...MANUAL_TRIGGER_DEFAULTS };
        case "AIAgent":
            return {...AIAGENT_DEFAULTS };
        case "LLMCall":
            return {...LLMCALL_DEFAULTS };
        default:
            return {};
    }
}

export function buildPayloadDict(payload) {
    if (!payload) return {};
    if (payload.type === "keypair") {
        const dict = {};
        for (const f of(payload.fields || [])) { if (f.key) dict[f.key] = f.value; }
        return dict;
    }
    if (payload.type === "json" && payload.json) {
        try { return JSON.parse(payload.json); } catch { return {}; }
    }
    return {};
}