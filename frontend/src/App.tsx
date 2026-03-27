import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DiscordLayout from "./layout/DiscordLayout";
import ServersPage from "./pages/ServersPage";
import { tokenStorage } from "./auth/tokenStorage";
import "./styles/app.css";
import "./styles/discord.css";

// HOC for Protected Routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!tokenStorage.hasTokens()) {
    return <Navigate to="/landing" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const navigate = useNavigate();

  const logout = () => {
    tokenStorage.clear();
    navigate("/landing");
  };

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage onStart={() => navigate("/auth")} />} />
      <Route path="/auth" element={<AuthPage onAuthed={() => navigate("/channels/@me")} />} />
      
      {/* Profile Route */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <DiscordLayout />
        </ProtectedRoute>
      } />

      {/* DM Routes */}
      <Route path="/channels/@me" element={
        <ProtectedRoute>
          <DiscordLayout />
        </ProtectedRoute>
      } />
      <Route path="/channels/@me/:friendId" element={
        <ProtectedRoute>
          <DiscordLayout />
        </ProtectedRoute>
      } />
      
      {/* Server Routes - Changed from /channels to /servers for clarity as per user request */}
      <Route path="/servers/:serverId" element={
        <ProtectedRoute>
          <DiscordLayout />
        </ProtectedRoute>
      } />
      <Route path="/servers/:serverId/settings" element={
        <ProtectedRoute>
          <DiscordLayout />
        </ProtectedRoute>
      } />
      <Route path="/servers/:serverId/:channelId" element={
        <ProtectedRoute>
          <DiscordLayout />
        </ProtectedRoute>
      } />

      {/* Legacy/Temp server management route */}
      <Route path="/servers-list" element={
        <ProtectedRoute>
          <div className="app-shell">
            <header className="app-topbar">
              <div className="app-topbar-inner">
                <div className="app-brand">Quản lý Server</div>
                <div className="app-actions">
                  <button className="app-btn primary" onClick={() => navigate("/channels/@me")} type="button">Vào Ứng Dụng</button>
                  <button className="app-btn danger" onClick={logout} type="button">Đăng xuất</button>
                </div>
              </div>
            </header>
            <ServersPage onOpenServer={(id) => navigate(`/servers/${id}`)} />
          </div>
        </ProtectedRoute>
      } />

      {/* Redirects */}
      <Route path="/" element={<Navigate to={tokenStorage.hasTokens() ? "/channels/@me" : "/landing"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
