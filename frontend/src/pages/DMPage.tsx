import { useCallback, useEffect, useRef, useState } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import { dmApi, type DmResponse, type BlockStatusResponse } from "../api/dmApi";
import { globalWsClient } from "../api/wsClient";
import { tokenStorage } from "../auth/tokenStorage";
import { userApi } from "../api/userApi";
import "../styles/app.css";

export default function DMPage(props: {
  friendUserId: string;
  friendUsername: string;
  blockStatus?: BlockStatusResponse | null;
  onBlockStatusChange?: (status: BlockStatusResponse) => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<DmResponse[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [hoveringMessageId, setHoveringMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<DmResponse | null>(null);
  const [showReactMenuFor, setShowReactMenuFor] = useState<string | null>(null);

  const [hoveringReactionKey, setHoveringReactionKey] = useState<string | null>(null);
  const hoverReactionTimer = useRef<number | null>(null);

  const EMOJIS = ["👍", "😢", "😂", "❤️", "😡"];


  const subRef = useRef<StompSubscription | null>(null);
  const errorSubRef = useRef<StompSubscription | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = tokenStorage.getUserIdFromAccessToken() ?? "";

  // Load lịch sử DM (REST)
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await dmApi.getHistory(props.friendUserId, 0, 50);
      // API trả về mới nhất trước → reverse để hiển thị cũ → mới
      setMessages([...page.items].reverse());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [props.friendUserId]);

  // ========== WebSocket setup ==========
  const ensureWs = async () => {
    if (!globalWsClient.connected) {
      try {
        await globalWsClient.connect({ useSockJS: false });
      } catch {
        try {
          await globalWsClient.connect({ useSockJS: true });
        } catch (e) {
          throw new Error("WS connect failed: " + String(e));
        }
      }
    }
  };

  const setupWsAndSubscribe = async () => {
    try {
      await ensureWs();

      // ✅ Spring STOMP user-destination:
      //    Server: convertAndSendToUser(userId, "/queue/dm", payload)
      //    Client subscribe: "/user/queue/dm"  ← Spring tự route theo session principal
      //    KHÔNG phải "/user/{userId}/queue/dm"
      if (subRef.current) subRef.current.unsubscribe();
      subRef.current = globalWsClient.subscribe("/user/queue/dm", (frame) => {
        try {
          const payload = JSON.parse(frame.body) as DmResponse;
          // Chỉ hiển thị tin nhắn thuộc conversation hiện tại
          const relevant =
            (payload.senderId === props.friendUserId && payload.receiverId === currentUserId) ||
            (payload.senderId === currentUserId && payload.receiverId === props.friendUserId);
          if (relevant) {
            setMessages((prev) => {
              const idx = prev.findIndex(item => item.id === payload.id);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = payload;
                return next;
              }
              return [...prev, payload];
            });
          }
        } catch {
          // ignore parse errors
        }
      });

      // Subscribe to dm-error để detect block lỗi từ server
      if (errorSubRef.current) errorSubRef.current.unsubscribe();
      errorSubRef.current = globalWsClient.subscribe("/user/queue/dm-error", (frame) => {
        try {
          const errPayload = JSON.parse(frame.body) as { error: string };
          if (errPayload.error && props.onBlockStatusChange) {
            // Gọi lại API để lấy trạng thái block mới nhất
            dmApi.getBlockStatus(props.friendUserId)
              .then(props.onBlockStatusChange)
              .catch(console.error);
          }
        } catch { }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "WS setup failed");
    }
  };

  // Khi friendUserId thay đổi: load history + subscribe
  useEffect(() => {
    setMessages([]);

    loadHistory();
    setupWsAndSubscribe();

    return () => {
      subRef.current?.unsubscribe();
      errorSubRef.current?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.friendUserId]);

  // Auto-scroll khi messages thay đổi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Gửi tin nhắn qua STOMP
  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content) return;

    try {
      await ensureWs();
      // Publish tới /app/dm/{receiverId}/send
      globalWsClient.publish(`/app/dm/${props.friendUserId}/send`, { 
        content,
        replyToMessageId: replyingTo?.id || null
      });
      setInput("");
      setError("");
      setReplyingTo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, props.friendUserId]);

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      {error && (
        <div className="app-msg err" style={{ margin: "16px 16px 0" }}>{error}</div>
      )}

      {/* Pinned Message */}
      {(() => {
         const pinnedMessages = messages.filter(m => m.pinned);
         if (pinnedMessages.length === 0) return null;
         const latestPinned = pinnedMessages[pinnedMessages.length - 1]; // Tin nhắn ghim mới nhất
         return (
            <div 
               style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#2B2D31', 
                  borderBottom: '1px solid #1E1F22', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
               }}
               onClick={() => {
                  const el = document.getElementById(`msg-${latestPinned.id}`);
                  if (el) {
                     el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     el.style.backgroundColor = 'rgba(88, 101, 242, 0.2)';
                     setTimeout(() => el.style.backgroundColor = 'transparent', 2000);
                  }
               }}
               title="Click to jump to message"
            >
               <span style={{ fontSize: '18px' }}>📌</span>
               <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', color: '#B5BAC1', fontWeight: 'bold' }}>Pinned Message</div>
                  <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#DBDEE1' }}>
                     {latestPinned.senderUsername}: {latestPinned.deleted ? <i style={{ opacity: 0.5 }}>{latestPinned.content}</i> : latestPinned.content}
                  </div>
               </div>
               {pinnedMessages.length > 1 && (
                  <div style={{ fontSize: '12px', color: '#B5BAC1', backgroundColor: '#1E1F22', padding: '2px 6px', borderRadius: '4px' }}>
                     {pinnedMessages.length} pinned
                  </div>
               )}
            </div>
         );
      })()}

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: 16 }}>Loading...</div>
        ) : messages.length === 0 ? (
          <div style={{ padding: 16 }}>No messages yet. Say hello! 👋</div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            
            // Tìm tin nhắn được reply
            let repliedMsg: DmResponse | undefined;
            if (m.replyToMessageId) {
               repliedMsg = messages.find(x => x.id === m.replyToMessageId);
            }

            return (
              <div 
                id={`msg-${m.id}`}
                key={m.id} 
                className="msg-item" 
                style={{ position: 'relative', marginTop: repliedMsg ? '16px' : '0' }}
                onMouseEnter={() => setHoveringMessageId(m.id)}
                onMouseLeave={() => {
                   setHoveringMessageId(null);
                   setShowReactMenuFor(null);
                }}
              >
                {/* Replying indicator */}
                {repliedMsg && (
                    <div style={{ position: 'absolute', top: '-18px', left: '44px', fontSize: '12px', color: '#B5BAC1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '12px', height: '12px', borderLeft: '2px solid #4F545C', borderTop: '2px solid #4F545C', borderTopLeftRadius: '4px', marginTop: '6px' }} />
                        <span>@{repliedMsg.senderUsername}</span>
                        <span style={{ opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {repliedMsg.content}
                        </span>
                    </div>
                )}

                <div className="msg-avatar" style={{ overflow: 'hidden' }}>
                    <img 
                        src={userApi.getAvatarUrl(m.senderId, new Date(m.createdAt).getTime())} 
                        alt="" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.backgroundColor = isMe ? '#23a559' : '#5865F2'; }} 
                    />
                </div>
                <div className="msg-content" style={{ width: '100%', paddingRight: '48px' }}>
                    <div className="msg-header">
                        <span className="msg-author">{isMe ? "You" : m.senderUsername}</span>
                        <span className="msg-time">{formatTime(m.createdAt)}</span>
                        {m.pinned && <span style={{ marginLeft: '8px', fontSize: '10px', backgroundColor: '#DA373C', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>📌 Pinned</span>}
                    </div>
                    <div className="msg-text">
                        {m.deleted ? (
                            <i style={{ opacity: 0.5 }}>{m.content}</i>
                        ) : (
                            m.content
                        )}
                    </div>
                    {/* Reactions */}
                    {m.reactions && Object.keys(m.reactions).length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                           {Object.entries(m.reactions).map(([emoji, users]) => {
                              const iReacted = users.includes(currentUserId);
                              const reactionKey = `${m.id}-${emoji}`;
                              return (
                                 <button 
                                    key={emoji} 
                                    onClick={() => dmApi.react(m.id, emoji, !iReacted)}
                                    onMouseEnter={() => {
                                       hoverReactionTimer.current = window.setTimeout(() => setHoveringReactionKey(reactionKey), 1500);
                                    }}
                                    onMouseLeave={() => {
                                       if (hoverReactionTimer.current) clearTimeout(hoverReactionTimer.current);
                                       setHoveringReactionKey(null);
                                    }}
                                    style={{ 
                                       position: 'relative',
                                       backgroundColor: iReacted ? 'rgba(88, 101, 242, 0.3)' : '#2B2D31', 
                                       border: iReacted ? '1px solid #5865F2' : '1px solid transparent', 
                                       borderRadius: '8px', 
                                       padding: '2px 6px', 
                                       fontSize: '14px',
                                       cursor: 'pointer',
                                       color: '#DBDEE1',
                                       display: 'flex',
                                       alignItems: 'center',
                                       gap: '4px'
                                    }}
                                 >
                                    <span>{emoji}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{users.length}</span>
                                    {/* Tooltip hiển thị người thả cảm xúc */}
                                    {hoveringReactionKey === reactionKey && m.reactionUsernames && m.reactionUsernames[emoji] && (
                                       <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px', backgroundColor: '#111214', color: '#DBDEE1', padding: '6px 10px', borderRadius: '4px', fontSize: '13px', whiteSpace: 'nowrap', zIndex: 30, boxShadow: '0 4px 8px rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
                                          {m.reactionUsernames[emoji].join(", ")}
                                          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: '5px', borderStyle: 'solid', borderColor: '#111214 transparent transparent transparent' }} />
                                       </div>
                                    )}
                                 </button>
                              );
                           })}
                        </div>
                    )}
                </div>

                {/* Hover Actions Menu */}
                {(hoveringMessageId === m.id || showReactMenuFor === m.id) && (
                   <div className="message-actions" style={{ position: "absolute", right: 16, top: -16, backgroundColor: "#2B2D31", border: "1px solid #1E1F22", borderRadius: "8px", display: "flex", gap: "2px", padding: "4px", zIndex: 10, boxShadow: "0 4px 6px rgba(0,0,0,0.2)" }}>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#B5BAC1' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#404249'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => setReplyingTo(m)} title="Reply">
                         ↩️
                      </button>
                      
                      <div style={{ position: 'relative' }}>
                         <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#B5BAC1' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#404249'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => setShowReactMenuFor(showReactMenuFor === m.id ? null : m.id)} title="React">
                            😀
                         </button>
                         {/* Emoji Picker Popup */}
                         {showReactMenuFor === m.id && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '8px', zIndex: 20 }}>
                               <div style={{ backgroundColor: '#1E1F22', border: '1px solid #3F4147', borderRadius: '8px', padding: '8px', display: 'flex', gap: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                  {EMOJIS.map(e => (
                                     <button key={e} onClick={() => { setShowReactMenuFor(null); dmApi.react(m.id, e, true); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px', borderRadius: '4px' }} onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#404249'} onMouseLeave={ev => ev.currentTarget.style.backgroundColor = 'transparent'}>{e}</button>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>

                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#B5BAC1' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#404249'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => dmApi.pin(m.id, !m.pinned)} title={m.pinned ? "Unpin" : "Pin"}>
                         📌
                      </button>

                      {isMe && !m.deleted && (
                         <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#F23F42' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#404249'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => { if(confirm("Thu hồi tin nhắn này?")) dmApi.delete(m.id); }} title="Delete">
                            🗑️
                         </button>
                      )}
                   </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input or Block Notice */}
      <div className="chat-input-wrapper" style={{ position: 'relative' }}>
        {props.blockStatus?.blocked && (
          <div style={{ textAlign: "center", padding: "16px", color: props.blockStatus.blocker ? "#F23F42" : "#B5BAC1", fontWeight: "bold", backgroundColor: "#2B2D31", borderRadius: "8px", marginBottom: "8px" }}>
             {props.blockStatus.blocker ? `Bạn đã chặn ${props.friendUsername}` : `${props.blockStatus.blockerUsername} đã chặn bạn`}
          </div>
        )}
        <div style={{ display: props.blockStatus?.blocked ? 'none' : 'block' }}>
           {replyingTo && (
              <div style={{ backgroundColor: '#2B2D31', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #1E1F22' }}>
                 <div style={{ color: '#B5BAC1', fontSize: '13px' }}>
                    Replying to <strong>@{replyingTo.senderUsername}</strong>
                 </div>
                 <button 
                    onClick={() => setReplyingTo(null)}
                    style={{ background: 'transparent', border: 'none', color: '#B5BAC1', cursor: 'pointer', fontSize: '16px' }}
                 >×</button>
              </div>
           )}
           <div className="chat-input-box" style={{ borderTopLeftRadius: replyingTo ? 0 : '8px', borderTopRightRadius: replyingTo ? 0 : '8px' }}>
               <input
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder={`Message @${props.friendUsername}...`}
                 onKeyDown={(e) => {
                   if (e.key === "Enter" && !e.shiftKey) {
                     e.preventDefault();
                     sendMessage();
                   }
                 }}
                 style={{
                   opacity: (error || props.blockStatus?.blocked) ? 0.5 : 1,
                 }}
                 disabled={!!error || !!props.blockStatus?.blocked}
               />
           </div>
        </div>
      </div>
    </div>
  );
}
