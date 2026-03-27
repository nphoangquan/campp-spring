import type { ServerResponse } from "./type";
// import type { ServerResponse } from "./types";

export default function ServerHeaderCard(props: {
  server: ServerResponse | null;
  serverName: string;
  setServerName: (v: string) => void;

  onUpdateServerName: () => void;
  onDeleteServer: () => void;
  onLeaveServer: () => void;
  onManageMembers: () => void;

  msg: string;
  error: string;
  currentUserRole: string;
}) {
  return (
    <div className="app-card">
      <div className="app-title">Server Detail</div>
      <div className="app-sub">
        {props.server ? (
          <>
            <span className="app-pill">serverId</span>{" "}
            <span className="code-like">{props.server.id}</span>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="app-pill">inviteCode</span>{" "}
              <span className="code-like">{props.server.inviteCode}</span>
              <button
                className="app-btn"
                style={{ backgroundColor: "#4f545c", padding: "4px 8px", fontSize: "12px", marginLeft: "10px" }}
                onClick={() => {
                  navigator.clipboard.writeText(props.server!.inviteCode);
                  alert("Đã copy Invite Code!");
                }}
                title="Copy Invite Code"
              >
                Copy
              </button>
            </div>
          </>
        ) : (
          "Loading server..."
        )}
      </div>

      <div style={{ marginTop: 24, padding: 20, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
        {props.currentUserRole === "OWNER" ? (
          <>
            <div className="app-field">
              <label style={{ color: "#B5BAC1", marginBottom: 8, display: "block" }}>Server Name</label>
              <input
                className="modal-input"
                value={props.serverName}
                onChange={(e) => props.setServerName(e.target.value)}
                style={{ marginBottom: 16 }}
              />
            </div>
            <div className="app-row" style={{ gap: "12px" }}>
              <button
                className="modal-btn-primary"
                onClick={props.onUpdateServerName}
                type="button"
              >
                Update Name
              </button>
              <button
                className="app-btn danger"
                onClick={props.onDeleteServer}
                type="button"
              >
                Delete Server
              </button>
            </div>
          </>
        ) : (
          <div className="app-row" style={{ gap: "12px" }}>
            <button
              className="app-btn danger"
              style={{ backgroundColor: "#da373c" }}
              onClick={props.onLeaveServer}
              type="button"
            >
              Leave Server
            </button>
          </div>
        )}
      </div>

      {props.msg && <div className="app-msg ok">✅ {props.msg}</div>}
      {props.error && <div className="app-msg err">❌ {props.error}</div>}
    </div>
  );
}
