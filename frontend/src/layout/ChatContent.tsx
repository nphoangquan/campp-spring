import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Phone, MoreVertical } from "lucide-react";
import FriendsPage from "../pages/FriendsPage";
import DMPage from "../pages/DMPage";
import ServerWorkspace from "./ServerWorkspace";
import VoiceChannelContent from "./VoiceChannelContent";
import { type StompSubscription } from "@stomp/stompjs";
import { type FriendResponse } from "../api/friendApi";
import { tokenStorage } from "../auth/tokenStorage";
import { type PresenceResponse, presenceApi, type PresenceStatus } from "../api/presenceApi";
import { globalWsClient } from "../api/wsClient";
import { userApi } from "../api/userApi";
import { dmApi, type BlockStatusResponse } from "../api/dmApi";
import { http } from "../api/http";

export default function ChatContent({
  mode,
  selectedServerId,
  activeDmFriendId,
  friends,
  activeChannelId,
  onSelectDM,
  activeProfileTab = "info",
}: {
  mode: "dm" | "server" | "profile";
  selectedServerId: string | null;
  activeDmFriendId: string | null;
  friends: FriendResponse[];
  activeChannelId: string | null;
  onSelectDM: (id: string) => void;
  activeProfileTab?: "info" | "security";
}) {
  const { pathname } = useLocation();
  const isSettings = pathname.endsWith("/settings");
  
  const [customStatus, setCustomStatus] = useState("");
  const [currentActivityMessage, setCurrentActivityMessage] = useState<string | null>(null);
  const [currentManualStatus, setCurrentManualStatus] = useState<string>("default");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // DM Call state
  type CallState = "idle" | "calling" | "receiving" | "active";
  const [callState, setCallState] = useState<CallState>("idle");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile data state
  const [profileUsername, setProfileUsername] = useState("");
  const [profileHasAvatar, setProfileHasAvatar] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "confirm" | "alert";
    onConfirm?: () => void;
  }>({    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    step: "confirm" | "otp";
    otpCode: string;
    loading: boolean;
    error: string;
  }>({
    isOpen: false,
    step: "confirm",
    otpCode: "",
    loading: false,
    error: ""
  });

  const [friendPresence, setFriendPresence] = useState<PresenceResponse | null>(null);
  const [blockStatus, setBlockStatus] = useState<BlockStatusResponse | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  useEffect(() => {
    setCallState("idle");
    if (mode !== "dm" || !activeDmFriendId) {
      setFriendPresence(null);
      setBlockStatus(null);
      return;
    }

    dmApi.getBlockStatus(activeDmFriendId)
      .then(setBlockStatus)
      .catch(console.error);

    let presenceSub: StompSubscription | null = null;
    let signalSub: StompSubscription | null = null;
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const p = await presenceApi.getPresence(activeDmFriendId);
        if (isMounted) setFriendPresence(p);
      } catch (e) {
        console.error(e);
      }
    };
    fetchInitial();

    const setupWs = async () => {
      try {
        if (!globalWsClient.connected) {
          await globalWsClient.connect({ useSockJS: false });
        }
      } catch {
        try {
          if (!globalWsClient.connected) await globalWsClient.connect({ useSockJS: true });
        } catch { }
      }

      if (isMounted && globalWsClient.connected) {
        presenceSub = globalWsClient.subscribe("/topic/presence", (frame) => {
          try {
             const payload = JSON.parse(frame.body) as PresenceResponse;
             if (payload.userId === activeDmFriendId) {
               setFriendPresence(payload);
             }
          } catch {}
        });
        
        const currentUserId = tokenStorage.getUserIdFromAccessToken() || "unknown";
        const dmChannelId = `dm_${[currentUserId, activeDmFriendId].sort().join('_')}`;
        
        signalSub = globalWsClient.subscribe(`/topic/voice/${dmChannelId}`, (frame) => {
            try {
                const msg = JSON.parse(frame.body);
                
                if (msg.type === "STATE_UPDATE" && msg.payload && msg.payload.dmSignal) {
                    const signal = msg.payload.dmSignal;
                    if (msg.senderId !== activeDmFriendId) return; // Chỉ nghe đối phương hiện tại

                    setCallState(prev => {
                        if (signal === "CALL_REQUEST" && prev === "idle") return "receiving";
                        if (signal === "CALL_ACCEPT" && prev === "calling") return "active";
                        if (signal === "CALL_REJECT" && prev === "calling") {
                            setTimeout(() => alert("Người dùng đã từ chối cuộc gọi."), 100);
                            return "idle";
                        }
                        if (signal === "CALL_CANCEL" && (prev === "receiving" || prev === "active")) return "idle";
                        if (signal === "CALL_END" && prev === "active") return "idle";
                        return prev;
                    });
                }
            } catch (e) {}
        });
      }
    };

    setupWs();

    return () => {
      isMounted = false;
      if (presenceSub) presenceSub.unsubscribe();
      if (signalSub) signalSub.unsubscribe();
    };
  }, [mode, activeDmFriendId]);

  const sendDmSignal = (signal: string) => {
     if (!globalWsClient.connected || !activeDmFriendId) return;
     const currentUserId = tokenStorage.getUserIdFromAccessToken() || "unknown";
     const channelId = `dm_${[currentUserId, activeDmFriendId].sort().join('_')}`;
     globalWsClient.publish("/app/voice.signal", {
         type: "STATE_UPDATE",
         channelId: channelId,
         payload: { dmSignal: signal }
     });
  };

  const showAlert = (title: string, message: string) => {
    setDialogState({ isOpen: true, title, message, type: "alert" });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogState({ isOpen: true, title, message, type: "confirm", onConfirm });
  };

  useEffect(() => {
    if (mode === "profile" && activeProfileTab === "info") {
      const userId = tokenStorage.getUserIdFromAccessToken();
      if (userId) {
        presenceApi.getPresence(userId)
          .then(res => {
            setCurrentActivityMessage(res.activityMessage || null);
            setCurrentManualStatus(res.manualStatus || "default");
          })
          .catch(console.error);

        userApi.getProfile()
          .then(res => {
            setProfileUsername(res.username || "");
            setProfileHasAvatar(res.hasAvatar || false);
            setProfileEmail(res.email || "");
          })
          .catch(console.error);
      }
    }
  }, [mode, activeProfileTab]);

  const handleUpdateCustomStatus = async () => {
    if (!customStatus.trim()) return;
    setIsUpdatingStatus(true);
    try {
      await presenceApi.updateActivity(customStatus.trim());
      setCurrentActivityMessage(customStatus.trim());
      alert("Đã cập nhật trạng thái tùy chỉnh thành công!");
      setCustomStatus("");
    } catch (error) {
      console.error(error);
      alert("Cập nhật trạng thái thất bại");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const clearActivityMessage = async () => {
    setIsUpdatingStatus(true);
    try {
      await presenceApi.updateActivity("");
      setCurrentActivityMessage(null);
      alert("Đã xóa trạng thái tùy chỉnh thành công!");
    } catch (error) {
      console.error(error);
      alert("Xóa trạng thái thất bại");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleChangeManualStatus = async (statusVal: string) => {
    setCurrentManualStatus(statusVal);
    const statusPayload = statusVal === "default" ? null : statusVal as PresenceStatus;
    try {
      await presenceApi.updateStatus(statusPayload);
    } catch (error) {
      console.error(error);
      alert("Cập nhật trạng thái hiển thị thất bại");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu mới không khớp");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await http("/api/users/me/password", {
        method: "PUT",
        body: { currentPassword, newPassword }
      });
      alert("Mật khẩu đã được thay đổi thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      alert("Thay đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteDialog({ isOpen: true, step: "confirm", otpCode: "", loading: false, error: "" });
  };

  const proceedDeleteStep1 = async () => {
    setDeleteDialog(s => ({ ...s, loading: true, error: "" }));
    try {
      await userApi.requestDeleteOtp();
      setDeleteDialog(s => ({ ...s, loading: false, step: "otp" }));
    } catch (e: any) {
      setDeleteDialog(s => ({ ...s, loading: false, error: e.message || "Không thể gửi OTP" }));
    }
  };

  const proceedDeleteStep2 = async () => {
    if (deleteDialog.otpCode.length !== 6) {
      setDeleteDialog(s => ({ ...s, error: "OTP phải có 6 chữ số" }));
      return;
    }
    setDeleteDialog(s => ({ ...s, loading: true, error: "" }));
    try {
      await userApi.deleteAccount({ code: deleteDialog.otpCode });
      alert("Tài khoản đã được xóa thành công!");
      tokenStorage.clear();
      window.location.href = "/landing";
    } catch (e: any) {
      setDeleteDialog(s => ({ ...s, loading: false, error: e.message || "OTP không hợp lệ hoặc đã hết hạn" }));
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileUsername.trim()) {
      showAlert("Lỗi", "Tên người dùng không được để trống!");
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const res = await userApi.updateProfile({ username: profileUsername.trim() });
      setProfileUsername(res.username || "");
      showAlert("Thành công", "Cập nhật thông tin thành công!");
    } catch (err: unknown) {
      console.error(err);
      showAlert("Lỗi", err instanceof Error ? err.message : "Cập nhật thông tin thất bại!");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showAlert("Lỗi", "File ảnh phải nhỏ hơn 5MB!");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showAlert("Lỗi", "Chỉ chấp nhận file ảnh!");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const executeUploadAvatar = async () => {
    if (!avatarFile) return;
    setIsUploadingAvatar(true);
    try {
      const res = await userApi.uploadAvatar(avatarFile);
      setProfileHasAvatar(res.hasAvatar);
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarKey(Date.now()); // force re-fetch
      showAlert("Thành công", "Ảnh đại diện đã được cập nhật!");
    } catch (err: unknown) {
      console.error(err);
      showAlert("Lỗi", err instanceof Error ? err.message : "Upload ảnh thất bại!");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUploadAvatar = () => {
    showConfirm("Xác nhận Tải lên", "Bạn có chắc chắn muốn lưu lại ảnh đại diện mới này không?", executeUploadAvatar);
  };

  if (mode === "profile") {
    const currentUserId = tokenStorage.getUserIdFromAccessToken() || "";
    const userEmail = tokenStorage.getEmailFromAccessToken() || "No email available";
    const currentAvatarUrl = profileHasAvatar ? `${userApi.getAvatarUrl(currentUserId)}?t=${avatarKey}` : null;

    return (
      <div className="col-chat">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeProfileTab === "info" ? "Personal Information" : "Security"}
          </div>
        </div>
        <div style={{ padding: '24px', flex: 1, color: '#DBDEE1', overflowY: 'auto', boxSizing: 'border-box' }}>
          {activeProfileTab === "info" && (
            <div style={{ maxWidth: '560px', width: '100%', boxSizing: 'border-box' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>Thông tin cá nhân</h2>

              {/* Avatar section */}
              <div style={{ backgroundColor: '#1E1F22', padding: '20px', borderRadius: '8px', marginBottom: '16px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'nowrap' }}>
                  {/* Avatar preview */}
                  <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#2B2D31', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #5865F2' }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : currentAvatarUrl ? (
                      <img src={currentAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '28px' }}>👤</span>
                    )}
                  </div>
                  {/* Upload controls */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#B5BAC1', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Ảnh đại diện</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <label style={{ backgroundColor: '#4752C4', color: 'white', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', flexShrink: 0 }}>
                        Chọn ảnh
                        <input type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ display: 'none' }} />
                      </label>
                      {avatarFile && (
                        <button onClick={handleUploadAvatar} disabled={isUploadingAvatar} style={{ backgroundColor: '#5865F2', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', opacity: isUploadingAvatar ? 0.7 : 1 }}>
                          {isUploadingAvatar ? "Đang tải..." : "Đăng tải ảnh"}
                        </button>
                      )}
                    </div>
                    <p style={{ marginTop: '6px', fontSize: '11px', color: '#87898c' }}>JPG, PNG, GIF tối đa 5MB</p>
                    {avatarFile && <p style={{ marginTop: '2px', fontSize: '11px', color: '#f59e0b' }}>Đã chọn: {avatarFile.name} — Nhấn "Đăng tải ảnh" để lưu</p>}
                  </div>
                </div>
              </div>

              {/* Username & email */}
              <div style={{ backgroundColor: '#1E1F22', padding: '20px', borderRadius: '8px', marginBottom: '16px', boxSizing: 'border-box' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#B5BAC1', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Tên người dùng</label>
                  <input
                    type="text"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#2B2D31', color: '#DBDEE1', border: 'none', padding: '10px 12px', borderRadius: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Nhập tên mới..."
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#B5BAC1', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Email</label>
                  <div style={{ backgroundColor: '#2B2D31', padding: '10px 12px', borderRadius: '4px', fontSize: '14px', color: '#949BA4', boxSizing: 'border-box' }}>
                    {profileEmail || userEmail}
                  </div>
                </div>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile || !profileUsername.trim()}
                  style={{ backgroundColor: profileUsername.trim() ? '#5865F2' : '#4752C4', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: profileUsername.trim() ? 'pointer' : 'not-allowed', fontWeight: '500', fontSize: '14px', opacity: isUpdatingProfile ? 0.7 : 1 }}
                >
                  {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>

              <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>Trạng thái</h2>
              <div style={{ backgroundColor: '#1E1F22', padding: '16px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#B5BAC1', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Trạng thái trực tuyến</label>
                  <select 
                    value={currentManualStatus}
                    onChange={(e) => handleChangeManualStatus(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#2B2D31', color: '#DBDEE1', border: 'none', padding: '10px 12px', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="default">Default</option>
                    <option value="ONLINE">Online</option>
                    <option value="IDLE">Idle</option>
                    <option value="DND">Do Not Disturb</option>
                    <option value="INVISIBLE">Invisible</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#B5BAC1', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Trạng thái tùy chỉnh</label>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="Nhập trạng thái tùy chỉnh của bạn..." 
                      style={{ flex: 1, backgroundColor: '#2B2D31', color: '#DBDEE1', border: 'none', padding: '10px 12px', borderRadius: '4px', fontSize: '14px', outline: 'none' }} 
                    />
                    <button 
                      onClick={handleUpdateCustomStatus}
                      disabled={isUpdatingStatus || !customStatus.trim()}
                      style={{ backgroundColor: customStatus.trim() ? '#5865F2' : '#4752C4', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: customStatus.trim() ? 'pointer' : 'not-allowed', fontWeight: '500', opacity: isUpdatingStatus ? 0.7 : 1 }}
                    >
                      {isUpdatingStatus ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                  
                  {currentActivityMessage && (
                    <div style={{ backgroundColor: '#2B2D31', padding: '12px', borderRadius: '4px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#B5BAC1' }}>Đang tự động hiển thị: </span>
                        <strong>{currentActivityMessage}</strong>
                      </div>
                      <button 
                         onClick={clearActivityMessage}
                         disabled={isUpdatingStatus}
                         style={{ background: 'transparent', border: 'none', color: '#F23F42', cursor: 'pointer', fontSize: '12px' }}
                      >
                         Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeProfileTab === "security" && (
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>Đổi mật khẩu</h2>
              <div style={{ backgroundColor: '#1E1F22', padding: '16px', borderRadius: '8px', marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#B5BAC1', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Mật khẩu hiện tại</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: '100%', backgroundColor: '#2B2D31', color: '#DBDEE1', border: 'none', padding: '10px 12px', borderRadius: '4px', fontSize: '14px', outline: 'none' }} placeholder="Nhập mật khẩu hiện tại" />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#B5BAC1', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Mật khẩu mới</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', backgroundColor: '#2B2D31', color: '#DBDEE1', border: 'none', padding: '10px 12px', borderRadius: '4px', fontSize: '14px', outline: 'none' }} placeholder="Nhập mật khẩu mới" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#B5BAC1', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Xác nhận mật khẩu mới</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', backgroundColor: '#2B2D31', color: '#DBDEE1', border: 'none', padding: '10px 12px', borderRadius: '4px', fontSize: '14px', outline: 'none' }} placeholder="Xác nhận mật khẩu mới" />
                </div>
                <button 
                  type="button" 
                  onClick={handleChangePassword}
                  disabled={isUpdatingPassword}
                  style={{ marginTop: '20px', backgroundColor: '#5865F2', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', fontWeight: '500', opacity: isUpdatingPassword ? 0.7 : 1 }}
                >
                  {isUpdatingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>

              <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #3F4147' }}>
                <h2 style={{ marginBottom: '8px', fontSize: '16px', color: '#F23F42', fontWeight: 'bold', textTransform: 'uppercase' }}>Xóa tài khoản</h2>
                <p style={{ color: '#B5BAC1', fontSize: '14px', marginBottom: '16px' }}>Thao tác này sẽ xóa vĩnh viễn tài khoản của bạn và không thể hoàn tác.</p>
                <button 
                  type="button" 
                  onClick={handleDeleteAccount}
                  style={{ backgroundColor: 'transparent', color: '#F23F42', border: '1px solid #F23F42', padding: '10px 24px', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Xóa Tài Khoản
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Account Dialog */}
        {deleteDialog.isOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: '#313338' }}>
              <div className="modal-header" style={{ paddingBottom: '12px' }}>
                <h2 className="modal-title" style={{ fontSize: '20px', color: '#FFFFFF', fontWeight: 'bold' }}>
                  Xóa tài khoản
                </h2>
              </div>
              <div className="modal-body" style={{ color: '#DBDEE1', fontSize: '15px', lineHeight: '1.4' }}>
                {deleteDialog.step === "confirm" ? (
                  <div style={{ textAlign: "center" }}>
                    <p>Bạn có chắc chắn muốn xóa tài khoản này không?</p>
                    <p style={{ marginTop: "8px", color: "#F23F42", fontWeight: "bold" }}>Thao tác này không thể hoàn tác.</p>
                  </div>
                ) : (
                  <div>
                     <p style={{ textAlign: "center", marginBottom: '16px' }}>Chúng tôi đã gửi mã xác nhận 6 số đến email của bạn. Vui lòng nhập mã để hoàn tất thủ tục xóa tài khoản.</p>
                     <input 
                        type="text" 
                        value={deleteDialog.otpCode}
                        onChange={e => setDeleteDialog(s => ({ ...s, otpCode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))}
                        placeholder="Nhập 6 số OTP"
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "4px", backgroundColor: "#1e1f22", color: "#fff", border: "1px solid #3f4147", textAlign: "center", fontSize: "16px", letterSpacing: "4px", outline: "none" }} 
                     />
                  </div>
                )}
                {deleteDialog.error && <p style={{ color: '#F23F42', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{deleteDialog.error}</p>}
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#2B2D31', padding: '16px' }}>
                <button 
                   className="modal-btn-link" 
                   style={{ fontSize: '14px', fontWeight: '500' }} 
                   onClick={() => setDeleteDialog(s => ({ ...s, isOpen: false }))}
                   disabled={deleteDialog.loading}
                >
                  Hủy
                </button>
                <button 
                  style={{ backgroundColor: '#F23F42', color: 'white', padding: '8px 24px', fontSize: '14px', fontWeight: '500', borderRadius: '4px', border: 'none', cursor: 'pointer', opacity: deleteDialog.loading ? 0.7 : 1 }} 
                  onClick={deleteDialog.step === "confirm" ? proceedDeleteStep1 : proceedDeleteStep2}
                  disabled={deleteDialog.loading}
                >
                  {deleteDialog.loading ? "Đang xử lý..." : deleteDialog.step === "confirm" ? "Tiếp tục" : "Xác nhận xóa"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Universal Dialog */}
        {dialogState.isOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: '#313338' }}>
              <div className="modal-header" style={{ paddingBottom: '12px' }}>
                <h2 className="modal-title" style={{ fontSize: '20px', color: '#FFFFFF', fontWeight: 'bold' }}>{dialogState.title}</h2>
              </div>
              <div className="modal-body" style={{ color: '#DBDEE1', fontSize: '15px', textAlign: 'center', lineHeight: '1.4' }}>
                {dialogState.message}
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#2B2D31', padding: '16px' }}>
                {dialogState.type === "confirm" && (
                  <button className="modal-btn-link" style={{ fontSize: '14px', fontWeight: '500' }} onClick={() => setDialogState(s => ({ ...s, isOpen: false }))}>
                    Hủy
                  </button>
                )}
                <button className="modal-btn-primary" style={{ padding: '8px 24px', fontSize: '14px', fontWeight: '500', borderRadius: '4px' }} onClick={() => {
                  setDialogState(s => ({ ...s, isOpen: false }));
                  if (dialogState.type === "confirm" && dialogState.onConfirm) {
                    dialogState.onConfirm();
                  }
                }}>
                  {dialogState.type === "confirm" ? "Xác nhận" : "Đóng"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === "dm") {
    // Tìm thông tin friend từ danh sách bạn bè đã có
    const currentFriend = friends.find(f => f.userId === activeDmFriendId);
    const friendName = currentFriend ? currentFriend.username : (activeDmFriendId ? "..." : "");

    const getPresenceBadge = () => {
       if (!friendPresence) return null;
       const status = friendPresence.status;
       const activity = friendPresence.activityMessage ? ` — ${friendPresence.activityMessage}` : '';

       let color = "#6b7280";
       let text = "Offline";

       if (status === "ONLINE") { color = "#22c55e"; text = "Online"; }
       else if (status === "IDLE") { color = "#f59e0b"; text = "Idle"; }
       else if (status === "DND") { color = "#ef4444"; text = "Do Not Disturb"; }
       
       return (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#B5BAC1', fontWeight: 'normal', gap: '6px', marginLeft: '8px', borderLeft: '1px solid #3F4147', paddingLeft: '8px' }}>
             <span style={{ color, fontSize: '10px' }}>●</span>
             <span>{text}{activity}</span>
          </div>
       );
    };

    if (!activeDmFriendId) {
      return (
        <div className="col-chat">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="chat-header-icon">👥</span> Friends
            </div>
          </div>
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
            <FriendsPage onOpenDM={(id) => onSelectDM(id)} />
          </div>
        </div>
      );
    }
    return (
       <div className="col-chat">
          <div className="chat-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>@ {friendName}</span>
              {activeDmFriendId && getPresenceBadge()}
            </div>
            <div style={{ display: 'flex', gap: '16px', color: '#B5BAC1' }}>
               <div title={callState !== "idle" ? "Rời cuộc gọi" : "Bắt đầu cuộc gọi"}>
                  <Phone size={20} style={{ cursor: 'pointer' }} onClick={() => {
                        if (callState === "idle") {
                            setCallState("calling");
                            sendDmSignal("CALL_REQUEST");
                        } else if (callState === "calling") {
                            setCallState("idle");
                            sendDmSignal("CALL_CANCEL");
                        } else if (callState === "active") {
                            setCallState("idle");
                            sendDmSignal("CALL_END");
                        }
                  }} />
               </div>
               <div style={{ position: 'relative' }}>
                  <MoreVertical 
                     size={20} 
                     style={{ cursor: 'pointer' }} 
                     onClick={() => setShowBlockMenu(!showBlockMenu)} 
                  />
                  {showBlockMenu && activeDmFriendId && (
                     <div 
                        style={{ 
                           position: 'absolute', 
                           top: '100%', 
                           right: 0, 
                           marginTop: '8px', 
                           backgroundColor: '#1E1F22', 
                           border: '1px solid #3F4147', 
                           borderRadius: '8px', 
                           padding: '8px', 
                           zIndex: 50, 
                           boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                           minWidth: '180px'
                        }}
                     >
                        {blockStatus?.blocker && blockStatus?.blocked ? (
                           <button 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setShowBlockMenu(false);
                                 setDialogState({
                                    isOpen: true,
                                    title: "Unblock User",
                                    message: `Bạn có chắc muốn bỏ chặn ${friendName}?`,
                                    type: "confirm",
                                    onConfirm: () => {
                                       dmApi.unblockUser(activeDmFriendId)
                                          .then(() => {
                                             if (activeDmFriendId) {
                                                dmApi.getBlockStatus(activeDmFriendId)
                                                  .then(setBlockStatus)
                                                  .catch(() => setBlockStatus({ blocked: false, blocker: false, blockerUsername: null }));
                                              }
                                          })
                                          .catch(console.error);
                                    }
                                 });
                              }}
                              style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#DBDEE1', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#404249'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                               Unblock this account?
                           </button>
                        ) : (
                           <button 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setShowBlockMenu(false);
                                 setDialogState({
                                    isOpen: true,
                                    title: "Chặn người dùng",
                                    message: `Bạn có chắc muốn chặn ${friendName}? Họ sẽ không thể gửi tin nhắn cho bạn nữa.`,
                                    type: "confirm",
                                    onConfirm: () => {
                                       dmApi.blockUser(activeDmFriendId)
                                          .then(() => {
                                             if (activeDmFriendId) {
                                                dmApi.getBlockStatus(activeDmFriendId)
                                                  .then(setBlockStatus)
                                                  .catch(() => setBlockStatus({ blocked: true, blocker: true, blockerUsername: "You" }));
                                              }
                                          })
                                          .catch(console.error);
                                    }
                                 });
                              }}
                              style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#F23F42', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#404249'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                               Block this account?
                           </button>
                        )}
                     </div>
                  )}
               </div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={() => setShowBlockMenu(false)}>
             {callState === "calling" && (
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111214', color: 'white' }}>
                     <div style={{ fontSize: '64px', marginBottom: '24px' }}>📞</div>
                     <h2 style={{ marginBottom: '8px' }}>Đang gọi cho {friendName}...</h2>
                     <button onClick={() => { setCallState('idle'); sendDmSignal('CALL_CANCEL'); }} style={{ marginTop: '24px', padding: '12px 32px', borderRadius: '24px', backgroundColor: '#F23F42', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Hủy cuộc gọi</button>
                 </div>
             )}
             {callState === "receiving" && (
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111214', color: 'white' }}>
                     <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔔</div>
                     <h2 style={{ marginBottom: '8px' }}>{friendName} đang gọi cho bạn...</h2>
                     <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                         <button onClick={() => { setCallState('active'); sendDmSignal('CALL_ACCEPT'); }} style={{ padding: '12px 32px', borderRadius: '24px', backgroundColor: '#23A559', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Chấp nhận</button>
                         <button onClick={() => { setCallState('idle'); sendDmSignal('CALL_REJECT'); }} style={{ padding: '12px 32px', borderRadius: '24px', backgroundColor: '#F23F42', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Từ chối</button>
                     </div>
                 </div>
             )}
             {callState === "active" && activeDmFriendId && (
                 <VoiceChannelContent 
                    channelId={`dm_${[tokenStorage.getUserIdFromAccessToken() || "unknown", activeDmFriendId].sort().join('_')}`} 
                    onLeave={() => {
                         setCallState("idle");
                         sendDmSignal("CALL_END");
                    }} 
                 />
             )}
             {callState === "idle" && (
                 <DMPage 
                    friendUserId={activeDmFriendId} 
                    friendUsername={friendName} 
                    blockStatus={blockStatus}
                    onBlockStatusChange={setBlockStatus}
                    onBack={() => {}} 
                 />
             )}
          </div>

        {/* Universal Dialog for DM */}
        {dialogState.isOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: '#313338' }}>
              <div className="modal-header" style={{ paddingBottom: '12px' }}>
                <h2 className="modal-title" style={{ fontSize: '20px', color: '#FFFFFF', fontWeight: 'bold' }}>{dialogState.title}</h2>
              </div>
              <div className="modal-body" style={{ color: '#DBDEE1', fontSize: '15px', textAlign: 'center', lineHeight: '1.4' }}>
                {dialogState.message}
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#2B2D31', padding: '16px' }}>
                {dialogState.type === "confirm" && (
                  <button className="modal-btn-link" style={{ fontSize: '14px', fontWeight: '500' }} onClick={() => setDialogState(s => ({ ...s, isOpen: false }))}>
                    Hủy
                  </button>
                )}
                <button className="modal-btn-primary" style={{ padding: '8px 24px', fontSize: '14px', fontWeight: '500', borderRadius: '4px' }} onClick={() => {
                  setDialogState(s => ({ ...s, isOpen: false }));
                  if (dialogState.type === "confirm" && dialogState.onConfirm) {
                    dialogState.onConfirm();
                  }
                }}>
                  {dialogState.type === "confirm" ? "Xác nhận" : "Đóng"}
                </button>
              </div>
            </div>
          </div>
        )}

       </div>
    );
  }

  if (!selectedServerId) {
    return <div className="col-chat"><div style={{ padding: 20 }}>Please select a server.</div></div>;
  }

  return <ServerWorkspace serverId={selectedServerId} activeChannelId={activeChannelId} isSettings={isSettings} />;
}
