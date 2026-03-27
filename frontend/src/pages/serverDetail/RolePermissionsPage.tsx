import { useEffect, useState } from "react";
import {
  serverApi,
  type RolePermissionsResponse,
} from "../../api/serverApi";
import { Shield, Save, CheckCircle2, AlertCircle } from "lucide-react";

const ALL_PERMISSIONS = [
  { key: "SEND_MESSAGE", label: "Gửi tin nhắn", desc: "Cho phép thành viên gửi tin nhắn trong các kênh văn bản." },
  { key: "KICK_MEMBER", label: "Kick thành viên", desc: "Trục xuất thành viên ra khỏi máy chủ." },
  { key: "CREATE_CHANNEL", label: "Tạo channel", desc: "Tạo kênh văn bản hoặc kênh thoại mới." },
  { key: "MANAGE_CHANNELS", label: "Quản lý channel/category", desc: "Sửa hoặc xóa các kênh và danh mục hiện có." },
  { key: "MANAGE_ROLES", label: "Quản lý role", desc: "Chỉnh sửa quyền hạn của các vai trò trong máy chủ." },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#E67E22",
  MEMBER: "#99AAB5",
};

interface Props {
  serverId: string;
}

export default function RolePermissionsPage({ serverId }: Props) {
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [localPerms, setLocalPerms] = useState<Record<string, Set<string>>>({});

  const loadPermissions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await serverApi.getRolePermissions(serverId);
      setRolePermissions(data);
      const init: Record<string, Set<string>> = {};
      for (const rp of data) {
        init[rp.role] = new Set(rp.permissions);
      }
      setLocalPerms(init);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải quyền thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [serverId]);

  const togglePermission = (role: string, perm: string) => {
    setLocalPerms((prev) => {
      const current = new Set(prev[role] ?? []);
      if (current.has(perm)) {
        current.delete(perm);
      } else {
        current.add(perm);
      }
      return { ...prev, [role]: current };
    });
  };

  const saveRole = async (role: string) => {
    setSaving(role);
    setError("");
    setSuccessMsg("");
    try {
      const perms = Array.from(localPerms[role] ?? []);
      await serverApi.updateRolePermissions(serverId, role, perms);
      setSuccessMsg(`Đã cập nhật quyền thành công cho vai trò ${role}`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadPermissions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu quyền thất bại");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: "#B5BAC1" }}>
      Đang tải dữ liệu quyền hạn...
    </div>
  );

  return (
    <div className="permissions-page" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ padding: "16px", background: "rgba(88, 101, 242, 0.1)", borderLeft: "4px solid #5865F2", borderRadius: "4px" }}>
        <p style={{ color: "#DBDEE1", margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
          <AlertCircle size={16} style={{ verticalAlign: "middle", marginRight: "8px", color: "#5865F2" }} />
          Chỉ <strong>Chủ sở hữu (Owner)</strong> hoặc <strong>Quản trị viên (Admin)</strong> mới có quyền thay đổi các cài đặt này. 
          Owner luôn có đầy đủ tất cả các quyền và không thể chỉnh sửa.
        </p>
      </div>

      {error && <div style={{ color: "#fa777c", background: "rgba(250,119,124,0.1)", padding: "12px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
        <AlertCircle size={18} /> {error}
      </div>}
      
      {successMsg && <div style={{ color: "#3ba55c", background: "rgba(59,165,92,0.1)", padding: "12px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
        <CheckCircle2 size={18} /> {successMsg}
      </div>}

      {rolePermissions.map((rp) => (
        <div
          key={rp.role}
          style={{ 
            background: "#2B2D31", 
            borderRadius: "8px", 
            overflow: "hidden",
            border: "1px solid #1E1F22"
          }}
        >
          <div style={{ 
            padding: "16px 20px", 
            background: "#313338", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            borderBottom: "1px solid #1E1F22"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "8px", 
                background: ROLE_COLORS[rp.role] || "#4F545C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white"
              }}>
                <Shield size={24} />
              </div>
              <div>
                <h4 style={{ color: "white", margin: 0, fontSize: "16px" }}>{rp.role}</h4>
                <span style={{ color: "#B5BAC1", fontSize: "12px" }}>
                  {rp.isDefault ? "Vai trò mặc định cho thành viên mới" : "Vai trò quản trị viên"}
                </span>
              </div>
            </div>
            
            <button
              className="modal-btn-primary"
              style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px" }}
              onClick={() => saveRole(rp.role)}
              disabled={saving === rp.role}
            >
              <Save size={16} />
              {saving === rp.role ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {ALL_PERMISSIONS.map((perm) => {
              const checked = localPerms[rp.role]?.has(perm.key) ?? false;
              return (
                <div 
                  key={perm.key}
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    padding: "12px",
                    background: checked ? "rgba(88, 101, 242, 0.05)" : "transparent",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: checked ? "rgba(88, 101, 242, 0.3)" : "rgba(255,255,255,0.05)",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "white", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{perm.label}</div>
                    <div style={{ color: "#949BA4", fontSize: "12px", lineHeight: "1.4" }}>{perm.desc}</div>
                  </div>
                  <div 
                    onClick={() => togglePermission(rp.role, perm.key)}
                    style={{ 
                      width: "40px", 
                      height: "22px", 
                      background: checked ? "#3BA55C" : "#4F545C",
                      borderRadius: "11px",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      flexShrink: 0,
                      marginLeft: "12px"
                    }}
                  >
                    <div style={{ 
                      width: "16px", 
                      height: "16px", 
                      background: "white", 
                      borderRadius: "50%", 
                      position: "absolute",
                      top: "3px",
                      left: checked ? "21px" : "3px",
                      transition: "left 0.2s"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
