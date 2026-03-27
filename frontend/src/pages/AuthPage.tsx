import { useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { tokenStorage } from "../auth/tokenStorage";
import "../styles/auth.css"; // Keep for fallback, but override visually

type Mode = "login" | "register" | "verify" | "forgot_password" | "reset_password";

export default function AuthPage(props: { onAuthed: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  // form fields
  const [username, setUsername] = useState("khanh");
  const [email, setEmail] = useState("khanh@gmail.com");
  const [password, setPassword] = useState("123456");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const title = useMemo(() => {
    switch (mode) {
      case "login": return "Đăng nhập";
      case "register": return "Đăng ký";
      case "verify": return "Xác thực tài khoản";
      case "forgot_password": return "Quên mật khẩu";
      case "reset_password": return "Đặt lại mật khẩu";
      default: return "";
    }
  }, [mode]);

  const switchMode = () => {
    setError("");
    setMessage("");
    if (mode === "login") setMode("register");
    else setMode("login"); 
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const res = await authApi.login({ email, password });
        tokenStorage.setTokens(res);
        setMessage("Login OK. Đã lưu token.");
        props.onAuthed();
      } else if (mode === "register") {
        const res = await authApi.register({ username, email, password });
        setMessage(res.message || "Đăng ký thành công. Vui lòng kiểm tra email.");
        setMode("verify");
      } else if (mode === "verify") {
        const res = await authApi.verify({ email, code: verificationCode });
        setMessage(res.message || "Xác thực thành công. Vui lòng đăng nhập.");
        setMode("login");
      } else if (mode === "forgot_password") {
        const res = await authApi.forgotPassword({ email });
        setMessage(res.message || "Đã gửi mã khôi phục tới email của bạn.");
        setMode("reset_password");
      } else if (mode === "reset_password") {
        const res = await authApi.resetPassword({ email, code: verificationCode, newPassword, confirmPassword });
        setMessage(res.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
        setMode("login");
      }
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(errMsg);
      if (mode === "login" && errMsg.includes("not verified")) {
        setMode("verify");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ position: "relative", zIndex: 1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@700;800&display=swap');
        
        .auth-page {
          background: #0f1117;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: #e2e8f0;
          overflow: hidden;
        }

        .auth-bg-orb-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: rgba(99,102,241,0.15);
          filter: blur(80px);
          border-radius: 50%;
          top: -10%;
          left: -10%;
          z-index: 0;
          pointer-events: none;
        }

        .auth-bg-orb-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          background: rgba(139,92,246,0.12);
          filter: blur(80px);
          border-radius: 50%;
          bottom: -10%;
          right: -5%;
          z-index: 0;
          pointer-events: none;
        }

        .auth-card {
          width: 100%;
          max-width: 460px;
          background: rgba(30, 33, 48, 0.4) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 20px !important;
          padding: 40px !important;
          box-shadow: 0 24px 80px rgba(0,0,0,0.4) !important;
          z-index: 10;
          position: relative;
        }

        .auth-logo {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          border: none !important;
          color: white;
          font-size: 18px;
        }

        .auth-brand-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px !important;
          letter-spacing: -0.02em;
        }

        .auth-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px !important;
          margin-top: 16px !important;
          margin-bottom: 24px !important;
          text-align: center;
        }

        .auth-field span {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 11px !important;
          color: #94a3b8 !important;
        }

        .auth-field input {
          background: rgba(15, 17, 23, 0.6) !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          padding: 14px 16px !important;
          border-radius: 12px !important;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px !important;
          color: #f1f5f9 !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .auth-field input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
        }

        .auth-btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          width: 100%;
          margin-top: 16px;
        }

        .auth-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.5);
        }

        .auth-btn-primary:disabled {
          opacity: 0.7;
          transform: none;
          cursor: not-allowed;
        }

        .auth-link {
          color: #a5b4fc !important;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500 !important;
          font-size: 13px;
        }
        
        .auth-link:hover {
          color: #c7d2fe !important;
          text-decoration: underline;
        }

        .auth-header {
           justify-content: center !important;
        }
      `}</style>
      
      <div className="auth-bg-orb-1" />
      <div className="auth-bg-orb-2" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="auth-logo" aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 8 }}>
              💬
            </span>
            <div style={{ textAlign: 'center' }}>
              <div className="auth-brand-title">Campp</div>
              <div className="auth-brand-sub" style={{ opacity: 0 }}>
                Phase 1: Auth + JWT + MongoDB
              </div>
            </div>
          </div>
        </div>

        <h1 className="auth-title">{title}</h1>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === "register" && (
            <label className="auth-field">
              <span>Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="khanh"
                minLength={3}
                maxLength={30}
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="khanh@gmail.com"
              type="email"
              required
            />
          </label>

          {mode !== "verify" && mode !== "forgot_password" && mode !== "reset_password" && (
            <label className="auth-field">
              <span>Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                type="password"
                minLength={6}
                required
              />
            </label>
          )}

          {(mode === "verify" || mode === "reset_password") && (
            <label className="auth-field">
              <span>Verification Code</span>
              <input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                type="text"
                maxLength={6}
                minLength={6}
                required
              />
            </label>
          )}

          {mode === "reset_password" && (
            <>
              <label className="auth-field">
                <span>New Password</span>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="******"
                  type="password"
                  minLength={6}
                  required
                />
              </label>
              <label className="auth-field">
                <span>Confirm Password</span>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  type="password"
                  minLength={6}
                  required
                />
              </label>
            </>
          )}

          <button className="auth-btn-primary" type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : mode === "register" ? "Bắt đầu miễn phí" : mode === "verify" ? "Xác minh ngay" : mode === "forgot_password" ? "Gửi mã khôi phục" : "Lưu mật khẩu mới"}
          </button>
        </form>

        {message && <div className="auth-msg ok">✅ {message}</div>}
        {error && <div className="auth-msg err">❌ {error}</div>}

        <div className="auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {mode === "login" && (
            <button className="auth-link" type="button" onClick={() => { setError(""); setMessage(""); setMode("forgot_password"); }}>
              Quên mật khẩu? Lấy mã
            </button>
          )}
          <button className="auth-link" type="button" onClick={switchMode}>
            {mode === "login"
              ? "Chưa có tài khoản? Đăng ký"
              : "Quay lại Đăng nhập"}
          </button>
        </div>

        <div className="auth-hint" style={{ opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 24, paddingTop: 16 }}>
          <div className="auth-hint-row" style={{ justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Secured by JWT & Spring Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
