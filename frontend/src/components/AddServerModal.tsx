import React, { useState } from "react";
import { ChevronRight, Copy, Check } from "lucide-react";
import { serverApi } from "../api/serverApi";

interface AddServerModalProps {
  onClose: () => void;
  onServerCreated: (serverId: string) => void;
  onServerJoined: () => void;
}

type ModalView = "choice" | "create" | "join" | "success";

export default function AddServerModal({ onClose, onServerCreated, onServerJoined }: AddServerModalProps) {
  const [view, setView] = useState<ModalView>("choice");
  const [serverName, setServerName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdServer, setCreatedServer] = useState<{ name: string; code: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await serverApi.createServer(serverName.trim());
      
      // Auto create "general" category
      try {
        const cat = await serverApi.createCategory(res.id, { name: "general" });
        // Auto create "general-chat" channel inside that category
        await serverApi.createChannel(res.id, { 
          name: "general-chat", 
          type: "TEXT", 
          categoryId: cat.id 
        });
      } catch (setupErr) {
        console.error("Failed to setup default categories/channels", setupErr);
        // We still continue because the server itself was created successfully
      }

      setCreatedServer({ name: res.name, code: res.inviteCode, id: res.id });
      setView("success");
    } catch (err: any) {
      setError(err.message || "Failed to create server");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      await serverApi.joinByInvite(inviteCode.trim());
      onServerJoined();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to join server");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdServer) {
      navigator.clipboard.writeText(createdServer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {view === "choice" && (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Create a server</h2>
              <p className="modal-sub">Your server is where you and your friends hang out. Make yours and start talking.</p>
            </div>
            <div className="modal-body">
              <div className="choice-box">
                <div className="choice-button" onClick={() => setView("create")}>
                  <span className="choice-label">Create My Own</span>
                  <ChevronRight size={20} color="#B5BAC1" />
                </div>
              </div>
              <div style={{ marginTop: "24px", textAlign: "center" }}>
                <h3 style={{ color: "white", fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Have an invite already?</h3>
                <button className="modal-btn-primary" style={{ width: "100%", backgroundColor: "#4E5058" }} onClick={() => setView("join")}>
                  Join a Server
                </button>
              </div>
            </div>
          </>
        )}

        {view === "create" && (
          <form onSubmit={handleCreate}>
            <div className="modal-header">
              <h2 className="modal-title">Customize your server</h2>
              <p className="modal-sub">Give your new server a personality with a name. You can always change it later.</p>
            </div>
            <div className="modal-body">
              <label className="form-label">Server Name</label>
              <input
                className="modal-input"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Enter server name"
                autoFocus
              />
              {error && <p style={{ color: "#fa777c", fontSize: "12px", marginTop: "8px" }}>{error}</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn-link" onClick={() => setView("choice")}>Back</button>
              <button type="submit" className="modal-btn-primary" disabled={loading || !serverName.trim()}>
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}

        {view === "join" && (
          <form onSubmit={handleJoin}>
            <div className="modal-header">
              <h2 className="modal-title">Join a Server</h2>
              <p className="modal-sub">Enter an invite below to join an existing server</p>
            </div>
            <div className="modal-body">
              <label className="form-label">Invite Link or Code</label>
              <input
                className="modal-input"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="h93ks82l"
                autoFocus
              />
              <p style={{ color: "#B5BAC1", fontSize: "12px", marginTop: "8px" }}>Invites should look like <code>h93ks82l</code></p>
              {error && <p style={{ color: "#fa777c", fontSize: "12px", marginTop: "8px" }}>{error}</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn-link" onClick={() => setView("choice")}>Back</button>
              <button type="submit" className="modal-btn-primary" disabled={loading || !inviteCode.trim()}>
                {loading ? "Joining..." : "Join Server"}
              </button>
            </div>
          </form>
        )}

        {view === "success" && createdServer && (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Server Created!</h2>
              <p className="modal-sub">Your server <strong>{createdServer.name}</strong> is ready. Share this invite code with your friends!</p>
            </div>
            <div className="modal-body">
              <label className="form-label">Server Name</label>
              <input className="modal-input" value={createdServer.name} readOnly style={{ marginBottom: "16px", opacity: 0.8 }} />
              
              <label className="form-label">Invite Code</label>
              <div className="copy-box">
                <input className="copy-input" value={createdServer.code} readOnly />
                <button className="copy-btn" onClick={copyToClipboard}>
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: "center" }}>
              <button className="modal-btn-primary" onClick={() => {
                onServerCreated(createdServer.id);
                onClose();
              }}>
                Take me to the server
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
