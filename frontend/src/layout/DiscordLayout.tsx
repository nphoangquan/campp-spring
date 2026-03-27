import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SidebarIcons from "./SidebarIcons";
import ChatContextArea from "./ChatContextArea";
import { friendApi, type FriendResponse } from "../api/friendApi";
import { globalWsClient } from "../api/wsClient";
import "../styles/discord.css";

export default function DiscordLayout() {
  const { serverId, channelId, friendId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'dm' (tin nhắn riêng/friends) hoặc 'server' (đang trong 1 server) hoặc 'profile'
  const [mode, setMode] = useState<"dm" | "server" | "profile">("dm");
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [activeProfileTab, setActiveProfileTab] = useState<"info" | "security">("info");

  useEffect(() => {
    if (location.pathname.startsWith("/profile")) {
      setMode("profile");
    } else if (serverId) {
      setMode("server");
    } else {
      setMode("dm");
    }
  }, [serverId, location.pathname]);

  useEffect(() => {
    // Luôn load friends để hiển thị tên khi route thay đổi
    friendApi.listFriends().then(setFriends).catch(console.error);

    // Keep global WebSocket connected for Presence to not bounce to Offline
    if (!globalWsClient.connected) {
      globalWsClient.connect().catch(console.error);
    }
  }, []);

  const handleSelectServer = (id: string) => {
    navigate(`/servers/${id}`);
  };

  const handleSelectDMIcon = () => {
    navigate("/channels/@me");
  };

  const handleSelectProfileIcon = () => {
    navigate("/profile");
  };

  const handleSelectChannel = (chanId: string) => {
    navigate(`/servers/${serverId}/${chanId}`);
  };

  const handleSelectFriend = (fId: string) => {
    navigate(`/channels/@me/${fId}`);
  };

  return (
    <div className="discord-layout">
      {/* Cột 1: Icon Servers & DM */}
      <SidebarIcons
        mode={mode}
        selectedServerId={serverId || null}
        onSelectDM={handleSelectDMIcon}
        onSelectServer={handleSelectServer}
        onSelectProfile={handleSelectProfileIcon}
      />

      {/* Cột 2 & Cột 3 được gói chung ở Content Area */}
      <ChatContextArea
        mode={mode}
        selectedServerId={serverId || null}
        activeDmFriendId={friendId || null}
        friends={friends}
        onSelectDM={handleSelectFriend}
        onViewFriends={() => navigate("/channels/@me")}
        activeChannelId={channelId || null}
        onSelectChannel={handleSelectChannel}
        activeProfileTab={activeProfileTab}
        onSelectProfileTab={setActiveProfileTab}
      />
    </div>
  );
}
