import SidebarContext from "./SidebarContext";
import ChatContent from "./ChatContent";
import { type FriendResponse } from "../api/friendApi";

export default function ChatContextArea({
  mode,
  selectedServerId,
  activeDmFriendId,
  friends,
  onSelectDM,
  onViewFriends,
  activeChannelId,
  onSelectChannel,
  activeProfileTab = "info",
  onSelectProfileTab,
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
  return (
    <>
      <SidebarContext 
        mode={mode} 
        selectedServerId={selectedServerId} 
        activeDmFriendId={activeDmFriendId}
        friends={friends}
        onSelectDM={onSelectDM} 
        onViewFriends={onViewFriends}
        activeChannelId={activeChannelId}
        onSelectChannel={onSelectChannel}
        activeProfileTab={activeProfileTab}
        onSelectProfileTab={onSelectProfileTab}
      />
      <ChatContent 
        mode={mode}
        selectedServerId={selectedServerId}
        activeDmFriendId={activeDmFriendId}
        friends={friends}
        activeChannelId={activeChannelId}
        onSelectDM={onSelectDM}
        activeProfileTab={activeProfileTab}
      />
    </>
  );
}
