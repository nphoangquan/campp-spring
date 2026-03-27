import { useEffect, useState } from "react";
import { serverApi, type ServerMemberResponse } from "../../api/serverApi";
import { UserMinus, RefreshCw, ShieldCheck, User } from "lucide-react";

interface Props {
  serverId: string;
  currentUserRole: string; // "OWNER" | "ADMIN" | "MEMBER"
}

export default function ServerMembersList({ serverId, currentUserRole }: Props) {
  const [members, setMembers] = useState<ServerMemberResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await serverApi.getServerMembers(serverId);
      setMembers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load members error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [serverId]);

  const canManageRole = (targetRole: string) => {
    if (currentUserRole === "OWNER" && targetRole !== "OWNER") return true;
    if (currentUserRole === "ADMIN" && targetRole !== "OWNER" && targetRole !== "ADMIN") return true;
    return false;
  };

  const canKick = (targetRole: string) => {
    if (currentUserRole === "OWNER" && targetRole !== "OWNER") return true;
    if (currentUserRole === "ADMIN" && targetRole !== "OWNER" && targetRole !== "ADMIN") return true;
    return false;
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await serverApi.updateMemberRole(serverId, userId, newRole);
      await loadMembers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update role failed");
    }
  };

  const handleKick = async (userId: string, username: string) => {
    if (!window.confirm(`Kick ${username}?`)) return;
    try {
      await serverApi.kickMember(serverId, userId);
      await loadMembers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Kick failed");
    }
  };


  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "OWNER": return { backgroundColor: "#ED4245", color: "white" };
      case "ADMIN": return { backgroundColor: "#E67E22", color: "white" };
      default: return { backgroundColor: "#99AAB5", color: "white" };
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "OWNER" || role === "ADMIN") return <ShieldCheck size={14} style={{ marginRight: 4 }} />;
    return null;
  };

  return (
    <div className="members-management" style={{ background: "#2B2D31", borderRadius: "8px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ color: "white", margin: 0, fontSize: "1.2rem" }}>Server Members ({members.length})</h3>
        <button 
          className="icon-btn" 
          onClick={loadMembers} 
          disabled={loading} 
          style={{ width: "32px", height: "32px", borderRadius: "4px", background: "#383A40" }}
          title="Refresh List"
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
        </button>
      </div>

      {error && <p style={{ color: "#fa777c", backgroundColor: "rgba(250,119,124,0.1)", padding: "10px", borderRadius: "4px" }}>{error}</p>}
      
      <div className="members-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {members.map(m => (
          <div key={m.userId} className="member-row" style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "10px 12px",
            background: "#313338",
            borderRadius: "4px",
            transition: "background 0.2s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "36px", 
                height: "36px", 
                borderRadius: "50%", 
                background: "#5865F2", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "white"
              }}>
                <User size={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "white", fontWeight: 600 }}>{m.username}</span>
                  <span style={{ 
                    fontSize: "10px", 
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 6px", 
                    borderRadius: "4px",
                    marginLeft: "8px",
                    display: "flex",
                    alignItems: "center",
                    ...getRoleBadgeStyle(m.role)
                  }}>
                    {getRoleIcon(m.role)}
                    {m.role}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#949BA4" }}>Joined at: {new Date(m.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {canManageRole(m.role) && (
                <select 
                  className="modal-input" 
                  style={{ padding: "6px", width: "120px", fontSize: "13px" }}
                  value={m.role}
                  onChange={e => handleRoleChange(m.userId, e.target.value)}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              )}
              
              <div style={{ display: "flex", gap: "4px" }}>
                {canKick(m.role) && (
                  <button 
                    className="app-btn" 
                    style={{ background: "#ED4245", padding: "6px", borderRadius: "4px", color: "white" }}
                    onClick={() => handleKick(m.userId, m.username)}
                    title="Kick Member"
                  >
                    <UserMinus size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {members.length === 0 && !loading && <p style={{ color: "#949BA4", textAlign: "center", padding: "20px" }}>No members found in this server.</p>}
      </div>
    </div>
  );
}
