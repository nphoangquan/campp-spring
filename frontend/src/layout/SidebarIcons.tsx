import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { serverApi, type ServerListItemResponse } from "../api/serverApi";
import AddServerModal from "../components/AddServerModal";

export default function SidebarIcons({
  mode,
  selectedServerId,
  onSelectDM,
  onSelectServer,
  onSelectProfile,
}: {
  mode: "dm" | "server" | "profile";
  selectedServerId: string | null;
  onSelectDM: () => void;
  onSelectServer: (id: string) => void;
  onSelectProfile: () => void;
}) {
  const [servers, setServers] = useState<ServerListItemResponse[]>([]);
  const [showModal, setShowModal] = useState(false);

  const loadServers = () => {
    serverApi.myServers()
      .then(setServers)
      .catch(console.error);
  };

  useEffect(() => {
    loadServers();
    // TODO: Subscribe to server joins to refresh list
  }, []);

  return (
    <div className="col-icons">
      <div 
        className={`icon-btn dm ${mode === "profile" ? "active" : ""}`}
        onClick={onSelectProfile}
        title="Personal Information"
        style={{ marginBottom: '8px' }}
      >
        <User size={24} />
      </div>

      <div 
        className={`icon-btn dm ${mode === "dm" ? "active" : ""}`}
        onClick={onSelectDM}
        title="Direct Messages"
      >
        <svg fill="currentColor" width="28" height="28" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.8 1.5 5.27 3.8 6.77-.3 2.14-1.5 3.75-1.6 3.86a.5.5 0 00.56.77c2.6-1.16 4.36-2.58 5.24-3.4 6.13.4 12-3.05 12-8 0-4.83-4.48-8.75-10-8.75z"/>
        </svg>
      </div>

      <div className="icon-divider" />

      {servers.map((s) => (
        <div 
          key={s.id}
          className={`icon-btn ${mode === "server" && selectedServerId === s.id ? "active" : ""}`}
          onClick={() => onSelectServer(s.id)}
          title={s.name}
        >
          {s.name.charAt(0).toUpperCase()}
        </div>
      ))}

      <div 
         className="icon-btn" 
         style={{ color: '#23a559' }}
         title="Add a Server"
         onClick={() => setShowModal(true)}
      >
         <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M13 5a1 1 0 10-2 0v6H5a1 1 0 100 2h6v6a1 1 0 102 0v-6h6a1 1 0 100-2h-6V5z"/></svg>
      </div>

      {showModal && (
        <AddServerModal 
          onClose={() => setShowModal(false)}
          onServerCreated={(id) => {
            loadServers();
            onSelectServer(id);
          }}
          onServerJoined={() => {
            loadServers();
          }}
        />
      )}
    </div>
  );
}
