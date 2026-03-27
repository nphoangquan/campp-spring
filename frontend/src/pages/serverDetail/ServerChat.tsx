import { useEffect, useMemo, useRef } from "react";
import type {
  CategoryResponse,
  ChannelResponse,
  MessageResponse,
  WsStatus,
} from "./type";

export default function ServerChat(props: {
  serverId: string;

  email: string;
  wsStatus: WsStatus;

  categories: CategoryResponse[];
  channels: ChannelResponse[];

  selectedChannelId: string;
  selectedChannel: ChannelResponse | null;

  chatMessages: MessageResponse[];
  chatLoading: boolean;
  chatInput: string;

  onChangeChatInput: (v: string) => void;

  onOpenTextChannel: (channelId: string) => void;
  onReloadHistory: () => void;
  onSendChat: () => void;

  onVoiceNotSupported: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sortedCategories = useMemo(() => {
    return [...props.categories].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
  }, [props.categories]);

  const sortedChannels = useMemo(() => {
    return [...props.channels].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
  }, [props.channels]);

  const channelsGrouped = useMemo(() => {
    const map = new Map<string, ChannelResponse[]>();
    for (const ch of sortedChannels) {
      const key = ch.categoryId ?? "__NO_CAT__";
      const arr = map.get(key) ?? [];
      arr.push(ch);
      map.set(key, arr);
    }
    return map;
  }, [sortedChannels]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [props.chatMessages.length]);

  const wsBadge = () => {
    if (props.wsStatus === "idle") return "WS: idle";
    if (props.wsStatus === "connecting") return "WS: connecting...";
    if (props.wsStatus === "connected") return "WS: connected";
    return "WS: error";
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="app-card" style={{ marginTop: 12 }}>
      <div className="app-row" style={{ marginBottom: 8 }}>
        <div>
          <div className="app-title">Realtime Chat (Phase 3)</div>
          <div className="app-sub">
            Chọn 1 <b>TEXT channel</b> để load history và chat realtime (STOMP).
          </div>
        </div>

        <div className="app-mini-actions" style={{ alignItems: "center" }}>
          <span className="app-pill" title="Tài khoản đang đăng nhập">
            {props.email}
          </span>
          <span className="app-pill" title="WebSocket status">
            {wsBadge()}
          </span>
        </div>
      </div>

      <div
        className="app-grid-2"
        style={{
          gridTemplateColumns: "360px 1fr",
        }}
      >
        {/* Left: Category + Channel tree */}
        <div
          className="app-card"
          style={{
            padding: 12,
            maxHeight: 520,
            overflow: "auto",
          }}
        >
          <div className="app-title" style={{ marginBottom: 6 }}>
            Browse Channels
          </div>
          <div className="app-sub" style={{ marginBottom: 10 }}>
            Click channel để mở chat. (VOICE channel chỉ hiển thị, chưa
            support).
          </div>

          {/* No category */}
          {channelsGrouped.get("__NO_CAT__")?.length ? (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                (no category)
              </div>
              {channelsGrouped.get("__NO_CAT__")!.map((ch) => (
                <button
                  key={ch.id}
                  className="app-btn"
                  type="button"
                  onClick={() => {
                    if (ch.type !== "TEXT") return props.onVoiceNotSupported();
                    props.onOpenTextChannel(ch.id);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    marginBottom: 8,
                    background:
                      props.selectedChannelId === ch.id
                        ? "rgba(229,231,235,0.12)"
                        : undefined,
                    borderColor:
                      props.selectedChannelId === ch.id
                        ? "rgba(229,231,235,0.35)"
                        : undefined,
                    opacity: ch.type === "TEXT" ? 1 : 0.6,
                  }}
                  title={
                    ch.type === "TEXT"
                      ? "Open text chat"
                      : "VOICE not supported"
                  }
                >
                  {ch.type === "TEXT" ? "# " : "• "}
                  {ch.name}
                </button>
              ))}
            </div>
          ) : null}

          {/* Categories */}
          {sortedCategories.map((cat) => {
            const list = channelsGrouped.get(cat.id) ?? [];
            return (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>
                  {cat.name}
                </div>

                {list.length ? (
                  list.map((ch) => (
                    <button
                      key={ch.id}
                      className="app-btn"
                      type="button"
                      onClick={() => {
                        if (ch.type !== "TEXT")
                          return props.onVoiceNotSupported();
                        props.onOpenTextChannel(ch.id);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        marginBottom: 8,
                        background:
                          props.selectedChannelId === ch.id
                            ? "rgba(229,231,235,0.12)"
                            : undefined,
                        borderColor:
                          props.selectedChannelId === ch.id
                            ? "rgba(229,231,235,0.35)"
                            : undefined,
                        opacity: ch.type === "TEXT" ? 1 : 0.6,
                      }}
                      title={
                        ch.type === "TEXT"
                          ? "Open text chat"
                          : "VOICE not supported"
                      }
                    >
                      {ch.type === "TEXT" ? "# " : "• "}
                      {ch.name}
                    </button>
                  ))
                ) : (
                  <div className="app-sub">No channels</div>
                )}
              </div>
            );
          })}

          {sortedChannels.length === 0 && (
            <div className="app-msg ok">Chưa có channel để chat.</div>
          )}
        </div>

        {/* Right: Chat box */}
        <div
          className="app-card"
          style={{ padding: 12, display: "flex", flexDirection: "column" }}
        >
          <div className="app-row" style={{ marginBottom: 8 }}>
            <div>
              <div className="app-title" style={{ marginBottom: 4 }}>
                {props.selectedChannel
                  ? `# ${props.selectedChannel.name}`
                  : "Chưa chọn channel"}
              </div>
              <div className="app-sub" style={{ marginBottom: 0 }}>
                {props.selectedChannel
                  ? `channelId: ${props.selectedChannel.id}`
                  : "Hãy chọn 1 TEXT channel ở bên trái."}
              </div>
            </div>

            <div className="app-mini-actions">
              <button
                className="app-btn"
                type="button"
                onClick={props.onReloadHistory}
                disabled={!props.selectedChannelId || props.chatLoading}
              >
                {props.chatLoading ? "Loading..." : "Reload messages"}
              </button>
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.18)",
              padding: 12,
              height: 380,
              overflow: "auto",
            }}
          >
            {!props.selectedChannelId ? (
              <div className="app-sub">Chưa chọn channel.</div>
            ) : props.chatLoading ? (
              <div className="app-sub">Đang tải lịch sử...</div>
            ) : props.chatMessages.length === 0 ? (
              <div className="app-sub">Chưa có tin nhắn.</div>
            ) : (
              props.chatMessages.map((m) => (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    <b>{m.senderEmail}</b>{" "}
                    <span style={{ opacity: 0.8 }}>
                      • {formatTime(m.createdAt)}
                    </span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={props.chatInput}
              onChange={(e) => props.onChangeChatInput(e.target.value)}
              placeholder={
                props.selectedChannelId
                  ? "Type a message..."
                  : "Select a channel first..."
              }
              disabled={!props.selectedChannelId}
              onKeyDown={(e) => {
                if (e.key === "Enter") props.onSendChat();
              }}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.22)",
                color: "#e5e7eb",
                outline: "none",
              }}
            />
            <button
              className="app-btn primary"
              type="button"
              onClick={props.onSendChat}
              disabled={!props.selectedChannelId || !props.chatInput.trim()}
            >
              Send
            </button>
          </div>

          <div className="app-sub" style={{ marginTop: 10 }}>
            Destination send:{" "}
            <span className="code-like">
              /app/server/{props.serverId}/channel/
              {props.selectedChannelId || "{channelId}"}/send
            </span>
            <br />
            Topic subscribe:{" "}
            <span className="code-like">
              /topic/server/{props.serverId}/channel/
              {props.selectedChannelId || "{channelId}"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
