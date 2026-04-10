// client/src/components/HttpRequestModal.jsx
// Opens on double-click of an APICall node.
// Combined URL field with Fixed / Expression mode toggle.
// Splits base_url + endpoint on save for the JSON schema.

import React, { useState } from "react";
import { X, Plus, Trash2, Globe, ChevronDown, Play, Loader } from "lucide-react";
import { executeAPI } from "../services/api";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const TABS    = ["Parameters", "Authentication", "Settings"];

function splitUrl(fullUrl) {
  if (!fullUrl) return { base_url: "", endpoint: "" };
  if (fullUrl.includes("{{")) return { base_url: fullUrl, endpoint: "" };
  try {
    const u = new URL(fullUrl);
    const base_url = u.origin;
    const endpoint = u.pathname + u.search + u.hash;
    return { base_url, endpoint: endpoint === "/" ? "" : endpoint };
  } catch {
    return { base_url: fullUrl, endpoint: "" };
  }
}

function joinUrl(base_url, endpoint) {
  return (base_url || "") + (endpoint || "");
}

export default function HttpRequestModal({ node, onSave, onClose }) {
  const p = node.data.parameters || {};

  const [urlValue,      setUrlValue]      = useState(joinUrl(p.base_url, p.endpoint));
  const [urlMode,       setUrlMode]       = useState(p.url_mode || "fixed");
  const [method,        setMethod]        = useState(p.method         || "GET");
  const [payloadType,   setPayloadType]   = useState(p.payload?.type  || "keypair");
  const [payloadFields, setPayloadFields] = useState(
    p.payload?.fields?.length ? p.payload.fields : [{ key: "", value: "" }]
  );
  const [payloadJson,   setPayloadJson]   = useState(p.payload?.json  || "");
  const [auth,          setAuth]          = useState(p.authentication  || { type: "none" });
  const [tab,           setTab]           = useState("Parameters");
  const [testing,       setTesting]       = useState(false);
  const [testResult,    setTestResult]    = useState(null);

  const hasBody = ["POST", "PUT", "PATCH"].includes(method);

  const handleSave = () => {
    const { base_url, endpoint } = splitUrl(urlValue.trim());
    onSave({
      base_url, endpoint, url_mode: urlMode, method,
      payload: {
        type:   payloadType,
        fields: payloadType === "keypair" ? payloadFields : [],
        json:   payloadType === "json"    ? payloadJson   : "",
      },
      authentication: auth,
      settings: p.settings || {},
    });
  };

  const handleTest = async () => {
    if (!urlValue.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const { base_url, endpoint } = splitUrl(urlValue.trim());
      const res = await executeAPI.runNode({
        base_url, endpoint, method,
        payload: { type: payloadType, fields: payloadFields, json: payloadJson },
        authentication: auth,
      });
      setTestResult({ ok: true, data: res.data });
    } catch (err) {
      setTestResult({ ok: false, data: err.response?.data || { error: err.message } });
    } finally {
      setTesting(false);
    }
  };

  const addField    = () => setPayloadFields([...payloadFields, { key: "", value: "" }]);
  const removeField = (i) => setPayloadFields(payloadFields.filter((_, idx) => idx !== i));
  const updateField = (i, f, v) => setPayloadFields(payloadFields.map((x, idx) => idx === i ? { ...x, [f]: v } : x));

  const { base_url: previewBase, endpoint: previewEndpoint } = splitUrl(urlValue);
  const showSplit = urlValue.trim() && !urlValue.includes("{{") && previewEndpoint;

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        <div style={s.header}>
          <div style={s.hLeft}>
            <div style={s.nodeIcon}><Globe size={16} color="#fff" /></div>
            <div>
              <p style={s.hTitle}>{node.data.label}</p>
              <p style={s.hSub}>APICall Node</p>
            </div>
          </div>
          <div style={s.hRight}>
            <button style={{ ...s.testBtn, opacity: !urlValue.trim() ? 0.5 : 1 }}
              onClick={handleTest} disabled={testing || !urlValue.trim()}>
              {testing ? <><Loader size={13} style={{ marginRight: 5 }} />Testing…</>
                       : <><Play   size={13} style={{ marginRight: 5 }} />execute Node</>}
            </button>
            <button style={s.closeBtn} onClick={onClose}><X size={17} /></button>
          </div>
        </div>

        <div style={s.tabs}>
          {TABS.map((t) => (
            <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div style={s.body}>
          {tab === "Parameters" && <>
            <div style={s.field}>
              <label style={s.label}>Method</label>
              <div style={s.selWrap}>
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={s.select}>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown size={13} style={s.selIcon} />
              </div>
            </div>

            <div style={s.field}>
              <div style={s.labelRow}>
                <label style={s.label}>URL</label>
                <div style={s.toggle}>
                  {["fixed", "expression"].map((m) => (
                    <button key={m}
                      style={{ ...s.toggleBtn, ...(urlMode === m ? s.toggleActive : {}) }}
                      onClick={() => setUrlMode(m)}>
                      {m === "fixed" ? "Fixed" : "Expression"}
                    </button>
                  ))}
                </div>
              </div>
              <input
                style={{
                  ...s.input,
                  background:  urlMode === "expression" ? "#0a0a1e" : "#0d0d20",
                  color:       urlMode === "expression" ? "#89b4fa" : "#e8e8f0",
                  fontFamily:  urlMode === "expression" ? "monospace" : "inherit",
                  borderColor: urlMode === "expression" ? "#1e3a6a" : "#2d2d4e",
                }}
                placeholder={urlMode === "fixed"
                  ? "https://api.example.com/users/list"
                  : "https://api.example.com/users/{{$json.userId}}"}
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
              />
              {urlMode === "expression" && (
                <p style={s.hint}>Use <span style={{ color: "#89b4fa", fontFamily: "monospace" }}>{"{{$json.field}}"}</span> to inject values from previous nodes.</p>
              )}
              {showSplit && (
                <div style={s.splitPreview}>
                  <div style={s.splitRow}><span style={s.splitLabel}>base_url</span><span style={s.splitValue}>{previewBase}</span></div>
                  <div style={s.splitRow}><span style={s.splitLabel}>endpoint</span><span style={{ ...s.splitValue, color: "#4ade80" }}>{previewEndpoint}</span></div>
                </div>
              )}
            </div>

            {hasBody && (
              <div style={s.field}>
                <div style={s.labelRow}>
                  <label style={s.label}>Body</label>
                  <div style={s.toggle}>
                    {["keypair", "json"].map((m) => (
                      <button key={m} style={{ ...s.toggleBtn, ...(payloadType === m ? s.toggleActive : {}) }} onClick={() => setPayloadType(m)}>
                        {m === "keypair" ? "Key / Value" : "JSON"}
                      </button>
                    ))}
                  </div>
                </div>
                {payloadType === "keypair" && (
                  <div style={s.kvList}>
                    {payloadFields.map((f, i) => (
                      <div key={i} style={s.kvRow}>
                        <input placeholder="Key"   style={{ ...s.input, flex: 1 }} value={f.key}   onChange={(e) => updateField(i, "key",   e.target.value)} />
                        <input placeholder="Value" style={{ ...s.input, flex: 1 }} value={f.value} onChange={(e) => updateField(i, "value", e.target.value)} />
                        <button style={s.iconBtn} onClick={() => removeField(i)}><Trash2 size={13} /></button>
                      </div>
                    ))}
                    <button style={s.addBtn} onClick={addField}><Plus size={13} style={{ marginRight: 4 }} />Add field</button>
                  </div>
                )}
                {payloadType === "json" && (
                  <textarea style={s.textarea} placeholder={'{\n  "key": "value"\n}'} value={payloadJson} onChange={(e) => setPayloadJson(e.target.value)} rows={6} />
                )}
              </div>
            )}
          </>}

          {tab === "Authentication" && (
            <div style={s.field}>
              <label style={s.label}>Auth Type</label>
              <div style={s.selWrap}>
                <select value={auth.type} onChange={(e) => setAuth({ type: e.target.value })} style={s.select}>
                  <option value="none">None</option>
                  <option value="bearerToken">Bearer Token</option>
                  <option value="apiKey">API Key</option>
                  <option value="basicAuth">Basic Auth</option>
                </select>
                <ChevronDown size={13} style={s.selIcon} />
              </div>
              {auth.type === "bearerToken" && (
                <div style={{ marginTop: 14 }}>
                  <label style={s.label}>Token</label>
                  <input style={{ ...s.input, marginTop: 6 }} placeholder="eyJhbGciOi..."
                    value={auth.bearerToken?.token || ""}
                    onChange={(e) => setAuth({ type: "bearerToken", bearerToken: { token: e.target.value } })} />
                </div>
              )}
              {auth.type === "apiKey" && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={s.label}>Send in</label>
                    <div style={{ ...s.toggle, marginTop: 6 }}>
                      {["header", "query"].map((v) => (
                        <button key={v} style={{ ...s.toggleBtn, ...(auth.apiKey?.in === v ? s.toggleActive : {}) }}
                          onClick={() => setAuth({ type: "apiKey", apiKey: { ...auth.apiKey, in: v } })}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label style={s.label}>Name</label><input style={{ ...s.input, marginTop: 6 }} placeholder="X-API-Key" value={auth.apiKey?.name || ""} onChange={(e) => setAuth({ type: "apiKey", apiKey: { ...auth.apiKey, name: e.target.value } })} /></div>
                  <div><label style={s.label}>Value</label><input style={{ ...s.input, marginTop: 6 }} placeholder="your-api-key" value={auth.apiKey?.value || ""} onChange={(e) => setAuth({ type: "apiKey", apiKey: { ...auth.apiKey, value: e.target.value } })} /></div>
                </div>
              )}
              {auth.type === "basicAuth" && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div><label style={s.label}>Username</label><input style={{ ...s.input, marginTop: 6 }} value={auth.basicAuth?.username || ""} onChange={(e) => setAuth({ type: "basicAuth", basicAuth: { ...auth.basicAuth, username: e.target.value } })} /></div>
                  <div><label style={s.label}>Password</label><input type="password" style={{ ...s.input, marginTop: 6 }} value={auth.basicAuth?.password || ""} onChange={(e) => setAuth({ type: "basicAuth", basicAuth: { ...auth.basicAuth, password: e.target.value } })} /></div>
                </div>
              )}
            </div>
          )}

          {tab === "Settings" && (
            <div style={s.placeholder}>
              <p style={s.placeholderText}>Settings — coming soon</p>
              <p style={s.hint}>Timeout, retry, SSL, redirect options will be here.</p>
            </div>
          )}

          {testResult && (
            <div style={{ ...s.resultBox, borderColor: testResult.ok ? "#1e5c3a" : "#5c1e1e", background: testResult.ok ? "#0d1f16" : "#1f0d0d" }}>
              <p style={{ ...s.resultStatus, color: testResult.ok ? "#4ade80" : "#f38ba8" }}>
                {testResult.ok ? `✓ ${testResult.data.status} ${testResult.data.statusText}` : "✗ Error"}
              </p>
              <pre style={s.resultPre}>{JSON.stringify(testResult.data.data ?? testResult.data, null, 2)}</pre>
            </div>
          )}
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.saveBtn}   onClick={handleSave}>Save Node</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:    { background: "#13132a", border: "1px solid #2d2d4e", borderRadius: 12, width: 560, maxWidth: "95vw", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #2d2d4e" },
  hLeft:    { display: "flex", alignItems: "center", gap: 11 },
  hRight:   { display: "flex", alignItems: "center", gap: 8 },
  nodeIcon: { width: 34, height: 34, borderRadius: 8, background: "#e06c3a", display: "flex", alignItems: "center", justifyContent: "center" },
  hTitle:   { margin: 0, fontSize: 14, fontWeight: 600, color: "#e8e8f0" },
  hSub:     { margin: 0, fontSize: 11, color: "#555" },
  testBtn:  { display: "flex", alignItems: "center", background: "#1a2a3a", border: "1px solid #1e4a6a", borderRadius: 7, padding: "6px 12px", fontSize: 12, color: "#89b4fa", fontWeight: 500, cursor: "pointer" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4, borderRadius: 6, display: "flex" },
  tabs:     { display: "flex", borderBottom: "1px solid #2d2d4e", padding: "0 18px" },
  tab:      { background: "none", border: "none", cursor: "pointer", padding: "9px 14px", fontSize: 12, color: "#666", borderBottom: "2px solid transparent", transition: "all 0.15s" },
  tabActive:{ color: "#e06c3a", borderBottom: "2px solid #e06c3a" },
  body:     { flex: 1, overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: 18 },
  field:    { display: "flex", flexDirection: "column", gap: 7 },
  labelRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  label:    { fontSize: 12, fontWeight: 500, color: "#999" },
  selWrap:  { position: "relative", display: "inline-flex", alignItems: "center" },
  select:   { appearance: "none", background: "#0d0d20", border: "1px solid #2d2d4e", borderRadius: 6, padding: "7px 32px 7px 10px", fontSize: 12, color: "#e8e8f0", cursor: "pointer", minWidth: 120 },
  selIcon:  { position: "absolute", right: 9, color: "#666", pointerEvents: "none" },
  input:    { background: "#0d0d20", border: "1px solid #2d2d4e", borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#e8e8f0", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", transition: "background 0.15s, border-color 0.15s" },
  toggle:   { display: "flex", background: "#0d0d20", border: "1px solid #2d2d4e", borderRadius: 6, overflow: "hidden" },
  toggleBtn:{ background: "none", border: "none", cursor: "pointer", padding: "4px 12px", fontSize: 11, color: "#666", transition: "all 0.12s" },
  toggleActive: { background: "#2d2d4e", color: "#e06c3a", fontWeight: 600 },
  splitPreview: { background: "#0a0a18", border: "1px solid #1e1e3a", borderRadius: 6, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 },
  splitRow: { display: "flex", alignItems: "baseline", gap: 10 },
  splitLabel: { fontSize: 10, color: "#555", fontWeight: 600, textTransform: "uppercase", minWidth: 60, flexShrink: 0 },
  splitValue: { fontSize: 11, color: "#89b4fa", fontFamily: "monospace", wordBreak: "break-all" },
  kvList:   { display: "flex", flexDirection: "column", gap: 6 },
  kvRow:    { display: "flex", gap: 6, alignItems: "center" },
  iconBtn:  { background: "none", border: "1px solid #2d2d4e", borderRadius: 6, padding: 7, cursor: "pointer", color: "#555", display: "flex", alignItems: "center" },
  addBtn:   { background: "none", border: "1px dashed #2d2d4e", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#666", cursor: "pointer", display: "flex", alignItems: "center" },
  textarea: { background: "#0d0d1a", border: "1px solid #2d2d4e", borderRadius: 6, padding: "9px 10px", fontSize: 12, color: "#89b4fa", fontFamily: "monospace", resize: "vertical", width: "100%", boxSizing: "border-box", outline: "none" },
  hint:     { margin: 0, fontSize: 11, color: "#444", lineHeight: 1.5 },
  placeholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "36px 0", textAlign: "center" },
  placeholderText: { margin: 0, fontSize: 13, color: "#444" },
  resultBox:   { border: "1px solid", borderRadius: 8, padding: "12px 14px", marginTop: 4 },
  resultStatus:{ margin: "0 0 8px", fontSize: 12, fontWeight: 600 },
  resultPre:   { margin: 0, fontSize: 11, color: "#888", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 200, overflowY: "auto" },
  footer:      { display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid #2d2d4e" },
  cancelBtn:   { background: "none", border: "1px solid #2d2d4e", borderRadius: 7, padding: "7px 18px", fontSize: 12, color: "#666", cursor: "pointer" },
  saveBtn:     { background: "#e06c3a", border: "none", borderRadius: 7, padding: "7px 22px", fontSize: 12, color: "#fff", fontWeight: 600, cursor: "pointer" },
};
