import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { workflowAPI } from "./services/api";
import AuthPage      from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import EditorPage    from "./pages/EditorPage";

function AppInner() {
  const { user, loading } = useAuth();
  const [openWorkflow,    setOpenWorkflow]    = useState(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);

  if (loading)        return <Splash text="Loading…" />;
  if (!user)          return <AuthPage />;
  if (loadingWorkflow)return <Splash text="Opening workflow…" />;

  const handleOpen = async (meta) => {
    setLoadingWorkflow(true);
    try {
      const id  = meta._id || meta.id;
      const res = await workflowAPI.get(id);
      setOpenWorkflow(res.data);
    } catch (err) {
      console.error("[open]", err);
      alert("Could not load workflow.");
    } finally {
      setLoadingWorkflow(false);
    }
  };

  if (openWorkflow) {
    return <EditorPage workflow={openWorkflow} onBack={() => setOpenWorkflow(null)} />;
  }
  return <DashboardPage onOpen={handleOpen} />;
}

function Splash({ text }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 14, fontFamily: "sans-serif" }}>
      {text}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
