import { useEffect, useState, useMemo } from "react";
import { Hash, Volume2, Users, Search, Plus } from "lucide-react";
import { serverApi, type ServerResponse, type CategoryResponse, type ChannelResponse } from "../api/serverApi";
import { type FriendResponse } from "../api/friendApi";
import { userApi } from "../api/userApi";
import { tokenStorage } from "../auth/tokenStorage";
import CreateContentModal from "../components/CreateContentModal";
import { globalWsClient } from "../api/wsClient";
import type { StompSubscription } from "@stomp/stompjs";

export default function SidebarContext({
  mode,
  selectedServerId,
  activeDmFriendId,
  friends,
  onSelectDM,
  onViewFriends,
  activeChannelId,
  onSelectChannel,
  activeProfileTab = "info",
  onSelectProfileTab
}: {
  mode: "dm" | "server" | "profile";
  selectedServerId: string | null;
  activeDmFriendId: string | null;
  friends: FriendResponse[];
  onSelectDM: (id: string) => void;
  onViewFriends: () => void;
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  activeProfileTab?: "info" | "security";
  onSelectProfileTab?: (tab: "info" | "security") => void;
}) {

  // ---- Server State ----
  const [server, setServer] = useState<ServerResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [channels, setChannels] = useState<ChannelResponse[]>([]);

  // Cache buster for avatars: only generate once per mount so it doesn't re-render images constantly
  const [avatarTs] = useState(Date.now());

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalConfig, setCreateModalConfig] = useState<{
    mode: "choice" | "category" | "channel";
    categoryId: string | null;
  }>({ mode: "choice", categoryId: null });

  const [currentUserRole, setCurrentUserRole] = useState<string>("MEMBER");
  const [canManageChannels, setCanManageChannels] = useState<boolean>(false);
  const [permissionVersion, setPermissionVersion] = useState<number>(0);
  const currentUserId = tokenStorage.getUserIdFromAccessToken();

  const loadServerData = () => {
    if (!selectedServerId) return;
    Promise.all([
      serverApi.getServer(selectedServerId),
      serverApi.listCategories(selectedServerId),
      serverApi.listChannels(selectedServerId),
      serverApi.getServerMembers(selectedServerId),
      serverApi.getRolePermissions(selectedServerId)
    ]).then(([s, cats, chs, members, roles]) => {
      setServer(s);
      setCategories(cats);
      setChannels(chs);
      
      const me = members.find(m => m.userId === currentUserId);
      const myRole = me ? me.role : "MEMBER";
      setCurrentUserRole(myRole);

      if (myRole === "OWNER") {
          setCanManageChannels(true);
      } else {
          const rolePerm = roles.find(r => r.role === myRole);
          if (rolePerm) {
              setCanManageChannels(
                rolePerm.permissions.includes("MANAGE_CHANNELS") || 
                rolePerm.permissions.includes("CREATE_CHANNEL")
              );
          } else {
              setCanManageChannels(myRole === "ADMIN");
          }
      }

      // Tự động pick channel đầu tiên
      const isSettings = window.location.pathname.endsWith("/settings");
      if (!isSettings && !activeChannelId && chs.length > 0) {
        const firstText = chs.find(c => c.type === "TEXT");
        if (firstText) onSelectChannel(firstText.id);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    let sub: StompSubscription | null = null;
    let eventsSub: StompSubscription | null = null;
    
    if (mode === "server" && selectedServerId) {
      loadServerData();
      
      const connectWs = async () => {
         if (!globalWsClient.connected) {
            try { await globalWsClient.connect({ useSockJS: false }); } catch {
               try { await globalWsClient.connect({ useSockJS: true }); } catch { return; }
            }
         }
         sub = globalWsClient.subscribe(`/topic/servers/${selectedServerId}/voice-status`, (frame) => {
             try {
                 const msg = JSON.parse(frame.body);
                 if (msg.type === "STATE_UPDATE" && msg.channelId) {
                     const hasActiveVoice = msg.payload?.hasActiveVoice;
                     setChannels(prev => prev.map(c => 
                         c.id === msg.channelId ? { ...c, hasActiveVoice } : c
                     ));
                 }
             } catch (err) {
                 console.error(err);
             }
         });

         eventsSub = globalWsClient.subscribe(`/topic/servers/${selectedServerId}/events`, (frame) => {
             try {
                 const msg = JSON.parse(frame.body);
                 if (msg.type === "PERMISSIONS_UPDATED" || msg.type === "ROLE_UPDATED") {
                     setPermissionVersion(v => v + 1);
                 }
             } catch {}
         });
      };
      
      connectWs();
    }
    
    return () => {
      if (sub) sub.unsubscribe();
      if (eventsSub) eventsSub.unsubscribe();
    };
  }, [mode, selectedServerId, permissionVersion]);

  const groupedChannels = useMemo(() => {
    const map = new Map<string | null, ChannelResponse[]>();
    map.set(null, []); // detached
    for (const c of categories) {
      map.set(c.id, []);
    }
    for (const ch of channels) {
      const arr = map.get(ch.categoryId);
      if (arr) arr.push(ch);
      else map.get(null)?.push(ch);
    }
    return map;
  }, [categories, channels]);

  if (mode === "profile") {
    return (
      <div className="col-context">
        <div className="context-header" style={{ height: "48px", borderBottom: "1px solid #1E1F22", display: "flex", alignItems: "center" }}>
          <span>Tài khoản của bạn</span>
        </div>
        <div className="context-content">
           <div 
             className={`context-item ${activeProfileTab === "info" ? "active" : ""}`}
             onClick={() => onSelectProfileTab?.("info")}
           >
             Profile
           </div>
           <div 
             className={`context-item ${activeProfileTab === "security" ? "active" : ""}`}
             onClick={() => onSelectProfileTab?.("security")}
           >
             Security
           </div>
           <div 
             className="context-item"
             onClick={onViewFriends}
           >
             Danh sách bạn bè
           </div>
           <div 
             className="context-item"
             style={{ color: '#F23F42' }}
             onClick={() => {
               tokenStorage.clear();
               window.location.href = '/landing';
             }}
           >
             Logout
           </div>
        </div>
      </div>
    );
  }

  if (mode === "dm") {
    return (
      <div className="col-context">
        <div className="context-header" style={{ height: "48px", borderBottom: "1px solid #1E1F22", display: "flex", alignItems: "center" }}>
          <div className="chat-input-box" style={{ width: "100%", padding: "4px 8px", backgroundColor: "#1E1F22" }}>
             <Search size={14} color="#80848E" />
             <input type="text" placeholder="Find or start a conversation" style={{ fontSize: "12px", width: "100%", padding: "4px" }} />
          </div>
        </div>
        <div className="context-content">
           <div 
             className={`context-item ${activeDmFriendId === null ? "active" : ""}`}
             onClick={onViewFriends}
           >
             <Users size={18} className="context-item-icon" />
             Friends
           </div>
           
           <div className="context-section-title">
             DIRECT MESSAGES
             <Plus size={14} style={{ cursor: "pointer" }} />
           </div>
           
           {friends.map(f => (
             <div 
               key={f.userId} 
               className={`context-item ${activeDmFriendId === f.userId ? "active" : ""}`}
               onClick={() => onSelectDM(f.userId)}
             >
               <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#5865F2", marginRight: "12px", flexShrink: 0, overflow: "hidden" }}>
                   <img 
                     src={userApi.getAvatarUrl(f.userId, avatarTs)} 
                     alt="" 
                     style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                     onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                   />
                 </div>
               {f.username}
             </div>
           ))}
        </div>
      </div>
    );
  }

  // mode === "server"
  return (
    <div className="col-context">
      <div className="context-header" style={{ justifyContent: "space-between" }}>
         <span>{server ? server.name : "Loading..."}</span>
         {canManageChannels && (
           <Plus 
             size={20} 
             style={{ cursor: "pointer", color: "#B5BAC1" }} 
             onClick={() => {
               setCreateModalConfig({ mode: "choice", categoryId: null });
               setShowCreateModal(true);
             }} 
           />
         )}
      </div>
      <div className="context-content">
        {/* Kênh không có nhóm */}
        {groupedChannels.get(null)?.map(ch => (
          <div 
            key={ch.id} 
            className={`context-item ${activeChannelId === ch.id ? "active" : ""}`}
            onClick={() => onSelectChannel(ch.id)}
          >
            {ch.type === "TEXT" ? (
                <Hash size={18} className="context-item-icon" />
            ) : (
                <Volume2 size={18} className="context-item-icon" color={ch.hasActiveVoice ? "#22c55e" : undefined} />
            )}
            {ch.name}
          </div>
        ))}

        {/* Channels trong category */}
        {categories.map(cat => (
          <div key={cat.id}>
             <div className="context-section-title">
                {cat.name}
                {canManageChannels && (
                  <Plus 
                    size={14} 
                    style={{ cursor: "pointer" }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateModalConfig({ mode: "channel", categoryId: cat.id });
                      setShowCreateModal(true);
                    }}
                  />
                )}
             </div>
             {groupedChannels.get(cat.id)?.map(ch => (
               <div 
                  key={ch.id} 
                  className={`context-item ${activeChannelId === ch.id ? "active" : ""}`}
                  onClick={() => onSelectChannel(ch.id)}
               >
                 {ch.type === "TEXT" ? (
                     <Hash size={18} className="context-item-icon" />
                 ) : (
                     <Volume2 size={18} className="context-item-icon" color={ch.hasActiveVoice ? "#22c55e" : undefined} />
                 )}
                 {ch.name}
               </div>
             ))}
          </div>
        ))}
      </div>

      {showCreateModal && selectedServerId && (
        <CreateContentModal 
          serverId={selectedServerId}
          categories={categories}
          initialMode={createModalConfig.mode}
          initialCategoryId={createModalConfig.categoryId}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadServerData}
        />
      )}
    </div>
  );
}
