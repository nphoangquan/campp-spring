import { useCallback, useEffect, useRef, useState } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import {
  friendApi,
  type FriendResponse,
  type UserSearchResult,
} from "../api/friendApi";
import { type PresenceResponse, presenceApi } from "../api/presenceApi";
import { globalWsClient } from "../api/wsClient";
import { tokenStorage } from "../auth/tokenStorage";
import "../styles/app.css";

type Tab = "friends" | "incoming" | "outgoing";

export default function FriendsPage(props: {
  onOpenDM: (friendUserId: string, friendUsername: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [incoming, setIncoming] = useState<FriendResponse[]>([]);
  const [outgoing, setOutgoing] = useState<FriendResponse[]>([]);
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceResponse>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  const subRef = useRef<StompSubscription | null>(null);
  const presenceSubRef = useRef<StompSubscription | null>(null);
  const currentUserId = tokenStorage.getUserIdFromAccessToken() ?? "";

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [f, inc, out] = await Promise.all([
        friendApi.listFriends(),
        friendApi.listIncoming(),
        friendApi.listOutgoing(),
      ]);
      setFriends(f);
      setIncoming(inc);
      setOutgoing(out);

      if (f.length > 0) {
        const ids = f.map((fr) => fr.userId);
        const presences = await presenceApi.getBulk(ids);
        const map = new Map<string, PresenceResponse>();
        for (const p of presences) map.set(p.userId, p);
        setPresenceMap(map);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load error");
    } finally {
      setLoading(false);
    }
  }, []);

  // WS notification: nhận lời mời kết bạn hoặc thông báo accept realtime
  useEffect(() => {
    if (!currentUserId) return;

    const setup = async () => {
      // Đảm bảo client đã kết nối
      if (!globalWsClient.connected) {
        try {
          await globalWsClient.connect({ useSockJS: false });
        } catch {
          try { await globalWsClient.connect({ useSockJS: true }); } catch { return; }
        }
      }

      if (subRef.current) subRef.current.unsubscribe();
      subRef.current = globalWsClient.subscribe(
        `/user/queue/friend-requests`,
        (_frame) => {
          // Tự động reload data khi có notification mới (friend request / accept)
          loadAll();
        }
      );

      // Subscribe to public presence updates (Phase 5)
      if (presenceSubRef.current) presenceSubRef.current.unsubscribe();
      presenceSubRef.current = globalWsClient.subscribe(
        `/topic/presence`,
        (frame) => {
          try {
            const updatedPresence = JSON.parse(frame.body) as PresenceResponse;
            setPresenceMap(prev => {
              const newMap = new Map(prev);
              newMap.set(updatedPresence.userId, updatedPresence);
              return newMap;
            });
          } catch {
             // ignore
          }
        }
      );
    };

    setup();
    loadAll();

    return () => {
      presenceSubRef.current?.unsubscribe();
      subRef.current?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // ---- Search by username ----
  const searchUser = async () => {
    if (!searchInput.trim()) return;
    setSearchError("");
    setSearchResult(null);
    setSearching(true);
    try {
      const result = await friendApi.searchByUsername(searchInput.trim());
      setSearchResult(result);
    } catch {
      setSearchError(`User "${searchInput.trim()}" not found.`);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (userId: string) => {
    setError(""); setMsg("");
    try {
      await friendApi.sendRequest(userId);
      setMsg("Friend request sent!");
      setSearchResult(null);
      setSearchInput("");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error sending request");
    }
  };

  const accept = async (id: string) => {
    setError(""); setMsg("");
    try {
      await friendApi.accept(id);
      setMsg("Friend request accepted!");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error accepting");
    }
  };

  const reject = async (id: string) => {
    setError(""); setMsg("");
    try {
      await friendApi.reject(id);
      setMsg("Request rejected.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error rejecting");
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("Remove this friend?");
    if (!ok) return;
    setError(""); setMsg("");
    try {
      await friendApi.remove(id);
      setMsg("Friend removed.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error removing");
    }
  };

  const cancelRequest = async (id: string) => {
    setError(""); setMsg("");
    try {
      await friendApi.remove(id);
      setMsg("Request cancelled.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cancelling");
    }
  };

  const presenceBadge = (userId: string) => {
    const p = presenceMap.get(userId);
    const status = p?.status ?? "OFFLINE";
    const activity = p?.activityMessage ? ` — ${p.activityMessage}` : '';

    switch (status) {
      case "ONLINE":
        return <span style={{ color: "#22c55e", fontSize: 12 }}>● Online{activity}</span>;
      case "IDLE":
        return <span style={{ color: "#f59e0b", fontSize: 12 }}>● Idle{activity}</span>;
      case "DND":
        return <span style={{ color: "#ef4444", fontSize: 12 }}>● Do Not Disturb{activity}</span>;
      case "INVISIBLE":
        return <span style={{ color: "#6b7280", fontSize: 12 }}>● Offline{activity}</span>;
      case "OFFLINE":
      default:
        return <span style={{ color: "#6b7280", fontSize: 12 }}>● Offline{activity}</span>;
    }
  };

  return (
    <div style={{ padding: "24px", color: "#DBDEE1" }}>
      <div>
        <div className="app-title" style={{ fontSize: "24px", color: "#FFF", marginBottom: "8px" }}>👥 Friends</div>
        <div className="app-sub" style={{ marginBottom: 12 }}>
          Search by username to add friends. Realtime notifications via WebSocket.
        </div>

        {/* Search by username */}
        <div style={{ marginBottom: 16 }}>
          <div className="app-row">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by username..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.22)",
                color: "#e5e7eb",
                outline: "none",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") searchUser(); }}
            />
            <button
              className="app-btn"
              type="button"
              onClick={searchUser}
              disabled={searching}
            >
              {searching ? "..." : "🔍 Search"}
            </button>
            <button className="app-btn" type="button" onClick={loadAll} disabled={loading}>
              {loading ? "..." : "↻ Refresh"}
            </button>
          </div>

          {/* Search result */}
          {searchError && (
            <div className="app-msg err" style={{ marginTop: 8 }}>{searchError}</div>
          )}
          {searchResult && (
            <div
              className="app-row"
              style={{
                marginTop: 8,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{searchResult.username}</span>
                <div style={{ fontSize: 11, opacity: 0.5 }}>ID: {searchResult.userId}</div>
              </div>
              {searchResult.userId === currentUserId ? (
                <span style={{ opacity: 0.4, fontSize: 12 }}>That's you</span>
              ) : (
                <button
                  className="app-btn primary"
                  type="button"
                  onClick={() => sendRequest(searchResult.userId)}
                >
                  + Add Friend
                </button>
              )}
            </div>
          )}
        </div>

        {error && <div className="app-msg err" style={{ marginBottom: 8 }}>{error}</div>}
        {msg && <div className="app-msg ok" style={{ marginBottom: 8 }}>{msg}</div>}

        {/* Tabs */}
        <div className="app-row" style={{ gap: 8, marginBottom: 12 }}>
          {(["friends", "incoming", "outgoing"] as Tab[]).map((t) => (
            <button
              key={t}
              className="app-btn"
              type="button"
              style={{ background: tab === t ? "rgba(99,102,241,0.25)" : undefined }}
              onClick={() => setTab(t)}
            >
              {t === "friends" && `Friends (${friends.length})`}
              {t === "incoming" && (
                incoming.length > 0
                  ? <span>Incoming <span style={{ color: "#f59e0b", fontWeight: 700 }}>({incoming.length})</span></span>
                  : `Incoming (0)`
              )}
              {t === "outgoing" && `Outgoing (${outgoing.length})`}
            </button>
          ))}
        </div>

        {/* Friends list */}
        {tab === "friends" && (
          <div>
            {friends.length === 0 ? (
              <div className="app-sub">No friends yet. Search by username to add someone!</div>
            ) : (
              friends.map((f) => (
                <div
                  key={f.friendshipId}
                  className="app-row"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    marginBottom: 8,
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{f.username}</span>
                    <span style={{ marginLeft: 8 }}>{presenceBadge(f.userId)}</span>
                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                      ID: {f.userId}
                    </div>
                  </div>
                  <div className="app-row" style={{ gap: 6 }}>
                    <button
                      className="app-btn primary"
                      type="button"
                      onClick={() => props.onOpenDM(f.userId, f.username)}
                    >
                      💬 DM
                    </button>
                    <button
                      className="app-btn danger"
                      type="button"
                      onClick={() => remove(f.friendshipId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Incoming requests */}
        {tab === "incoming" && (
          <div>
            {incoming.length === 0 ? (
              <div className="app-sub">No incoming friend requests.</div>
            ) : (
              incoming.map((f) => (
                <div
                  key={f.friendshipId}
                  className="app-row"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    marginBottom: 8,
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{f.username}</span>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>wants to be your friend</div>
                  </div>
                  <div className="app-row" style={{ gap: 6 }}>
                    <button
                      className="app-btn primary"
                      type="button"
                      onClick={() => accept(f.friendshipId)}
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="app-btn danger"
                      type="button"
                      onClick={() => reject(f.friendshipId)}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Outgoing requests */}
        {tab === "outgoing" && (
          <div>
            {outgoing.length === 0 ? (
              <div className="app-sub">No outgoing requests.</div>
            ) : (
              outgoing.map((f) => (
                <div
                  key={f.friendshipId}
                  className="app-row"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    marginBottom: 8,
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{f.username}</span>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>pending...</div>
                  </div>
                  <button
                    className="app-btn danger"
                    type="button"
                    onClick={() => cancelRequest(f.friendshipId)}
                  >
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
