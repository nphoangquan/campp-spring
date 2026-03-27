import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import { Hash, Settings } from "lucide-react";
import { globalWsClient } from "../api/wsClient";
import { getChannelMessages, type MessageResponse, messageApi } from "../api/messageApi";
import { serverApi, type ChannelResponse } from "../api/serverApi";
import { userApi } from "../api/userApi";
import ServerDetailPage from "../pages/ServerDetailPage";
import { tokenStorage } from "../auth/tokenStorage";
import VoiceChannelContent from "./VoiceChannelContent";

export default function ServerWorkspace({
  serverId,
  activeChannelId,
  isSettings
}: {
  serverId: string;
  activeChannelId: string | null;
  isSettings?: boolean;
}) {
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState<MessageResponse[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<ChannelResponse | null>(null);

  const [canSendMessage, setCanSendMessage] = useState<boolean>(true);
  const [permissionVersion, setPermissionVersion] = useState<number>(0);

  const [hoveringMessageId, setHoveringMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<MessageResponse | null>(null);
  const [showReactMenuFor, setShowReactMenuFor] = useState<string | null>(null);

  const [hoveringReactionKey, setHoveringReactionKey] = useState<string | null>(null);
  const hoverReactionTimer = useRef<number | null>(null);

  const EMOJIS = ["👍", "😢", "😂", "❤️", "😡"];
  const currentUserId = tokenStorage.getUserIdFromAccessToken() ?? "";

  const subRef = useRef<StompSubscription | null>(null);
  const eventsSubRef = useRef<StompSubscription | null>(null);

  // Load channel & permissions
  useEffect(() => {
    if (!activeChannelId) return;
    
    // 1. Get channel info
    serverApi.listChannels(serverId).then(chs => {
       const ch = chs.find(c => c.id === activeChannelId);
       setChannel(ch || null);
    }).catch(console.error);

    // 2. Check if user has SEND_MESSAGE permission
    Promise.all([
       serverApi.getServerMembers(serverId),
       serverApi.getRolePermissions(serverId)
    ]).then(([members, roles]) => {
         const me = members.find(m => m.userId === currentUserId);
         const myRole = me ? me.role : "MEMBER";
         
         if (myRole === "OWNER") {
             setCanSendMessage(true);
         } else {
             const rolePerm = roles.find(r => r.role === myRole);
             if (rolePerm) {
                 setCanSendMessage(rolePerm.permissions.includes("SEND_MESSAGE"));
             } else {
                 setCanSendMessage(true);
             }
         }
    }).catch(console.error);
    
  }, [serverId, activeChannelId, currentUserId, permissionVersion]);

  // Load chat & WS
  useEffect(() => {
    if (!activeChannelId || channel?.type === "VOICE") {
       setChatMessages([]);
       return;
    }

    setLoading(true);
    getChannelMessages(activeChannelId, 0, 50).then(page => {
       setChatMessages([...page.items].reverse());
    }).catch(console.error).finally(() => setLoading(false));

    const connectWs = async () => {
       if (!globalWsClient.connected) {
          try { await globalWsClient.connect({ useSockJS: false }); } 
          catch {
             try { await globalWsClient.connect({ useSockJS: true }); } catch { return; }
          }
       }
       if (subRef.current) subRef.current.unsubscribe();
       subRef.current = globalWsClient.subscribe(`/topic/server/${serverId}/channel/${activeChannelId}`, (frame) => {
         try {
           const payload = JSON.parse(frame.body) as MessageResponse;
           setChatMessages(prev => {
              const idx = prev.findIndex(item => item.id === payload.id);
              if (idx !== -1) {
                  const next = [...prev];
                  next[idx] = payload;
                  return next;
              }
              return [...prev, payload];
           });
         } catch { }
       });

       // Subscribe for server events (permissions updated, role updated)
       if (eventsSubRef.current) eventsSubRef.current.unsubscribe();
       eventsSubRef.current = globalWsClient.subscribe(`/topic/servers/${serverId}/events`, (frame) => {
          try {
              const msg = JSON.parse(frame.body);
              if (msg.type === "PERMISSIONS_UPDATED" || msg.type === "ROLE_UPDATED") {
                  setPermissionVersion(v => v + 1);
              }
          } catch { }
       });
    };
    connectWs();

    return () => {
       subRef.current?.unsubscribe();
       eventsSubRef.current?.unsubscribe();
    };
  }, [serverId, activeChannelId, channel?.type]);

  const sendChat = async (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    const content = chatInput.trim();
    if (!content || !activeChannelId) return;

    if (globalWsClient.connected) {
       globalWsClient.publish(`/app/server/${serverId}/channel/${activeChannelId}/send`, { 
         content, 
         replyToMessageId: replyingTo?.id || null 
       });
       setChatInput("");
       setReplyingTo(null);
    }
  };

  if (isSettings) {
     return (
        <div style={{ flex: 1, overflowY: 'auto' }}>
           <ServerDetailPage serverId={serverId} onBack={() => navigate(`/servers/${serverId}`)} />
        </div>
     );
  }

  if (!activeChannelId) {
     return <div className="col-chat" style={{ justifyContent: 'center', alignItems: 'center' }}>Vui lòng chọn kênh ở cột bên trái.</div>;
  }

  return (
    <div className="col-chat" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="chat-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hash size={20} className="chat-header-icon" />
          {channel?.name || "Loading..."}
        </div>
        <div>
           <span title="Cài đặt Server (dành cho Admin)">
              <Settings 
                size={20} 
                style={{ cursor: 'pointer', color: '#B5BAC1' }} 
                onClick={() => navigate(`/servers/${serverId}/settings`)} 
              />
           </span>
        </div>
      </div>

      {channel?.type === "VOICE" ? (
         <VoiceChannelContent 
            channelId={activeChannelId} 
            onLeave={() => navigate(`/servers/${serverId}`)} 
         />
      ) : (
         <>
           {/* Pinned Message */}
           {(() => {
              const pinnedMessages = chatMessages.filter(m => m.pinned);
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
                       const el = document.getElementById(`server-msg-${latestPinned.id}`);
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
                          {latestPinned.senderEmail.split('@')[0]}: {latestPinned.deleted ? <i style={{ opacity: 0.5 }}>{latestPinned.content}</i> : latestPinned.content}
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

           <div className="chat-messages" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {loading && <div>Loading messages...</div>}
              {chatMessages.map(m => {
                 const isMe = m.senderId === currentUserId;
                 let repliedMsg: MessageResponse | undefined;
                 if (m.replyToMessageId) {
                    repliedMsg = chatMessages.find(x => x.id === m.replyToMessageId);
                 }

                 return (
                    <div 
                       id={`server-msg-${m.id}`}
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
                             <span>@{repliedMsg.senderEmail.split('@')[0]}</span>
                             <span style={{ opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                 {repliedMsg.content}
                             </span>
                          </div>
                       )}

                       <div className="msg-avatar" style={{ overflow: "hidden" }}>
                          <img 
                             src={userApi.getAvatarUrl(m.senderId, new Date(m.createdAt).getTime())} 
                             alt="" 
                             style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                             onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.backgroundColor = isMe ? '#23a559' : '#5865F2'; }} 
                          />
                       </div>
                       <div className="msg-content" style={{ width: '100%', paddingRight: '48px' }}>
                          <div className="msg-header">
                             <span className="msg-author">{isMe ? "You" : m.senderEmail.split('@')[0]}</span>
                             <span className="msg-time">{new Date(m.createdAt).toLocaleString()}</span>
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
                                         onClick={() => messageApi.react(m.id, emoji, !iReacted)}
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
                                            <button key={e} onClick={() => { setShowReactMenuFor(null); messageApi.react(m.id, e, true); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px', borderRadius: '4px' }} onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#404249'} onMouseLeave={ev => ev.currentTarget.style.backgroundColor = 'transparent'}>{e}</button>
                                         ))}
                                      </div>
                                   </div>
                                )}
                             </div>

                             <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#B5BAC1' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#404249'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => messageApi.pin(m.id, !m.pinned)} title={m.pinned ? "Unpin" : "Pin"}>
                                📌
                             </button>

                             {isMe && !m.deleted && (
                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#F23F42' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#404249'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => { if(confirm("Thu hồi tin nhắn này?")) messageApi.delete(m.id); }} title="Delete">
                                   🗑️
                                </button>
                             )}
                          </div>
                       )}
                    </div>
                 );
              })}
           </div>
           
           <div className="chat-input-wrapper" style={{ padding: "0 16px 24px" }}>
              {replyingTo && (
                 <div style={{ backgroundColor: '#2B2D31', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #1E1F22' }}>
                    <div style={{ color: '#B5BAC1', fontSize: '13px' }}>
                       Replying to <strong>@{replyingTo.senderEmail.split('@')[0]}</strong>
                    </div>
                    <button 
                       onClick={() => setReplyingTo(null)}
                       style={{ background: 'transparent', border: 'none', color: '#B5BAC1', cursor: 'pointer', fontSize: '16px' }}
                    >×</button>
                 </div>
              )}
              <div className="chat-input-box" style={{ borderTopLeftRadius: replyingTo ? 0 : '8px', borderTopRightRadius: replyingTo ? 0 : '8px' }}>
                 {canSendMessage ? (
                   <input 
                      type="text" 
                      placeholder={`Message #${channel?.name || ""}`} 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={sendChat}
                   />
                 ) : (
                   <input
                      type="text"
                      placeholder="Owner/Admin không cho phép bạn gửi tin nhắn"
                      disabled
                      style={{ cursor: "not-allowed", opacity: 0.6, userSelect: "none", filter: "blur(1px)", backgroundColor: "rgba(0,0,0,0.2)" }}
                   />
                 )}
              </div>
           </div>
         </>
      )}
    </div>
  );
}
