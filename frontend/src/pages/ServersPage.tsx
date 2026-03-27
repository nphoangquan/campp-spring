import { useEffect, useMemo, useState } from "react";
import { serverApi, type ServerListItemResponse } from "../api/serverApi";
import { presenceApi } from "../api/presenceApi";
import "../styles/app.css";

export default function ServersPage(props: {
  onOpenServer: (serverId: string) => void;
}) {
  const [servers, setServers] = useState<ServerListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [createName, setCreateName] = useState("My First Server");
  const [inviteCode, setInviteCode] = useState("");
  
  const [activityInput, setActivityInput] = useState("");
  const [activityMsg, setActivityMsg] = useState("");

  const empty = useMemo(
    () => servers.length === 0 && !loading,
    [servers.length, loading],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await serverApi.myServers();
      setServers(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load servers error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createServer = async () => {
    setError("");
    try {
      const res = await serverApi.createServer(createName.trim());
      await load();
      props.onOpenServer(res.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create server error");
    }
  };

  const joinByInvite = async () => {
    setError("");
    try {
      await serverApi.joinByInvite(inviteCode.trim());
      // JoinLeaveResponse only has message, so reload list
      await load();
      setInviteCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Join by invite error");
    }
  };

  const updateActivity = async () => {
    setError("");
    setActivityMsg("");
    try {
      await presenceApi.updateActivity(activityInput.trim());
      setActivityMsg("Update activity OK!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update error");
    }
  };

  return (
    <div className="app-container">
      <div className="app-grid-2">
        <div className="app-card">
          <div className="app-row">
            <div>
              <div className="app-title">Servers của tôi</div>
              <div className="app-sub">
                Danh sách server bạn đã join (Phase 2).
              </div>
            </div>
            <button
              className="app-btn"
              onClick={load}
              type="button"
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Reload"}
            </button>
          </div>

          <div className="app-divider" />

          {empty && (
            <div className="app-msg ok">
              Bạn chưa có server nào. Tạo mới ở bên phải.
            </div>
          )}

          <ul className="app-list">
            {servers.map((s) => (
              <li key={s.id} className="app-item">
                <div>
                  <div className="app-item-title">{s.name}</div>
                  <div className="app-item-sub">
                    <span className="app-pill">{s.role}</span>{" "}
                    <span className="code-like">id: {s.id}</span>
                  </div>
                </div>

                <div className="app-mini-actions">
                  <button
                    className="app-btn primary"
                    onClick={() => props.onOpenServer(s.id)}
                    type="button"
                  >
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {error && <div className="app-msg err">❌ {error}</div>}
        </div>

        <div className="app-card">
          <div className="app-title">Trạng Thái (Presence)</div>
          <div className="app-sub">Cập nhật activity message cá nhân. Bạn bè sẽ thấy bạn đổi trạng thái ngay lập tức qua WebSocket.</div>
          <div className="app-field">
            <input
              value={activityInput}
              onChange={(e) => setActivityInput(e.target.value)}
              placeholder="Đang làm bài tập nhóm..."
            />
          </div>
          <button className="app-btn primary" onClick={updateActivity} type="button">
            Lưu Activity
          </button>
          {activityMsg && <div className="app-msg ok" style={{ marginTop: 8 }}>{activityMsg}</div>}
        </div>

        <div className="app-card" style={{ marginTop: 12 }}>
          <div className="app-title">Tạo / Join server</div>
          <div className="app-sub">
            Dùng để test create server và join server bằng invite code.
          </div>

          <div className="app-field">
            <label>Tên server</label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="My Server"
            />
          </div>
          <button
            className="app-btn primary"
            onClick={createServer}
            type="button"
          >
            Create Server
          </button>

          <div className="app-divider" />

          <div className="app-field">
            <label>Invite code</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="vd: a1b2c3d4..."
            />
          </div>
          <button className="app-btn" onClick={joinByInvite} type="button">
            Join by invite
          </button>

          <div className="app-divider" />
          <div className="app-sub">
            Tip: invite code bạn lấy trong chi tiết server (OWNER sẽ thấy).
          </div>
        </div>
      </div>
    </div>
  );
}
