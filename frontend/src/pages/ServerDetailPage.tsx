import { useEffect, useState } from "react";
import {
  serverApi,
  type ServerResponse,
} from "../api/serverApi";
import { tokenStorage } from "../auth/tokenStorage";

import ServerHeaderCard from "./serverDetail/ServerHeaderCard";
import ServerMembersList from "./serverDetail/ServerMembersList";
import RolePermissionsPage from "./serverDetail/RolePermissionsPage";

export default function ServerDetailPage(props: {
  serverId: string;
  onBack: () => void;
}) {
  const [server, setServer] = useState<ServerResponse | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("MEMBER");
  const [showMembersPage, setShowMembersPage] = useState(false);
  const [showPermissionsSection, setShowPermissionsSection] = useState(false);

  // server update
  const [serverName, setServerName] = useState("");

  const loadAll = async () => {
    setError("");
    setMsg("");
    try {
      const [s, members] = await Promise.all([
        serverApi.getServer(props.serverId),
        serverApi.getServerMembers(props.serverId)
      ]);
      
      setServer(s);
      setServerName(s.name);
      
      const currentUserId = tokenStorage.getUserIdFromAccessToken();
      const me = members.find(m => m.userId === currentUserId);
      if (me) setCurrentUserRole(me.role);

    } catch (e) {
      setError(e instanceof Error ? e.message : "Load server detail error");
    }
  };

  useEffect(() => {
    loadAll();
  }, [props.serverId]);

  const updateServerName = async () => {
    setError("");
    setMsg("");
    try {
      const s = await serverApi.updateServer(props.serverId, serverName.trim());
      setServer(s);
      setMsg("Update server name OK");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update server error");
    }
  };

  const deleteServer = async () => {
    setError("");
    setMsg("");
    const ok = confirm("Xoá server? (Chỉ OWNER mới xoá được)");
    if (!ok) return;

    try {
      await serverApi.deleteServer(props.serverId);
      props.onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete server error");
    }
  };

  const leaveServer = async () => {
    setError("");
    setMsg("");
    const ok = confirm("Leave server? (OWNER không được leave)");
    if (!ok) return;

    try {
      const res = await serverApi.leaveServer(props.serverId);
      setMsg(res.message);
      props.onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Leave server error");
    }
  };

  return (
    <div style={{ padding: "24px", color: "#DBDEE1" }}>
      <div className="app-row" style={{ marginBottom: 24 }}>
        <h1 style={{ color: "white", fontSize: "24px", margin: 0 }}>Server Settings</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
          <button
            className="app-btn"
            style={{ background: showMembersPage ? "#6f42c1" : "#4e5058" }}
            onClick={() => {
              setShowMembersPage(!showMembersPage);
              setShowPermissionsSection(false);
            }}
            type="button"
          >
            {showMembersPage ? "← Server Info" : "👥 Members"}
          </button>
          <button className="app-btn danger" onClick={props.onBack} type="button">
            Close
          </button>
        </div>
      </div>

      {showMembersPage ? (
        <div className="settings-section">
          <div className="app-row" style={{ marginBottom: 16 }}>
            <h2 style={{ color: "white" }}>
              {showPermissionsSection ? "Role Permissions" : "Members & Roles"}
            </h2>
            {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
                <button
                className="app-btn"
                style={{ marginLeft: "auto", background: "#5865F2" }}
                onClick={() => setShowPermissionsSection((v) => !v)}
                type="button"
                >
                {showPermissionsSection ? "Back to Members" : "⚙ Roles"}
                </button>
            )}
          </div>

          {showPermissionsSection ? (
            <RolePermissionsPage serverId={props.serverId} />
          ) : (
            <ServerMembersList serverId={props.serverId} currentUserRole={currentUserRole} />
          )}
        </div>
      ) : (
        <div className="settings-section">
          <ServerHeaderCard
            server={server}
            serverName={serverName}
            setServerName={setServerName}
            onUpdateServerName={updateServerName}
            onDeleteServer={deleteServer}
            onLeaveServer={leaveServer}
            onManageMembers={() => setShowMembersPage(true)}
            msg={msg}
            error={error}
            currentUserRole={currentUserRole}
          />
        </div>
      )}
    </div>
  );
}
