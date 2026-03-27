import { tokenStorage } from "../auth/tokenStorage";
import "../styles/auth.css";

export default function DashboardPage(props: {
  onLogout: () => void;
  onGoApp: () => void;
  onBackToLanding: () => void;
}) {
  const logout = () => {
    tokenStorage.clear();
    props.onLogout();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <span className="auth-logo" aria-hidden="true">
              🎉
            </span>
            <div>
              <div className="auth-brand-title">Đăng nhập thành công</div>
              <div className="auth-brand-sub">
                Bạn có thể bắt đầu test Phase 2 UI
              </div>
            </div>
          </div>

          <button className="auth-link" onClick={logout} type="button">
            Logout
          </button>
        </div>

        <div className="auth-msg ok">
          ✅ Token đã được lưu. Mọi request sẽ tự gắn Authorization và tự
          refresh khi gặp 401.
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <button className="auth-btn" type="button" onClick={props.onGoApp}>
            Vào App (Servers)
          </button>

          <button
            className="auth-link"
            type="button"
            onClick={props.onBackToLanding}
          >
            ← Về Landing
          </button>
        </div>
      </div>
    </div>
  );
}
