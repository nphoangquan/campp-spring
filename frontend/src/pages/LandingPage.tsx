import { useState, useEffect, useRef } from "react";

const MESSAGES = [
  { user: "vinh", avatar: "V", color: "#e879f9", text: "Hey everyone! 👋", time: "just now" },
  { user: "minh", avatar: "M", color: "#38bdf8", text: "What's up! The new chat is so fast 🚀", time: "just now" },
  { user: "linh", avatar: "L", color: "#34d399", text: "I love the realtime feel!", time: "just now" },
  { user: "vinh", avatar: "V", color: "#e879f9", text: "Đúng rồi, xịn lắm 🔥", time: "just now" },
  { user: "minh", avatar: "M", color: "#38bdf8", text: "No lag at all 😍", time: "just now" },
];

const CHANNELS = ["# general-chat", "# random", "# announcements", "# hahaa"];
const USERS = [
  { name: "vinh", avatar: "V", color: "#e879f9", status: "online" },
  { name: "minh", avatar: "M", color: "#38bdf8", status: "online" },
  { name: "linh", avatar: "L", color: "#34d399", status: "idle" },
  { name: "you", avatar: "Y", color: "#fb923c", status: "online" },
];

export default function LandingPage({ onStart }: { onStart: () => void }) {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [typedText, setTypedText] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const fullText = "Chat without limits.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let i = 0;
    const show = () => {
      if (i < MESSAGES.length) {
        setVisibleMessages((prev) => [...prev, i]);
        i++;
        setTimeout(show, 600);
      }
    };
    setTimeout(show, 800);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#0f1117", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1a1d27; }
        ::-webkit-scrollbar-thumb { background: #3b3f52; border-radius: 3px; }

        .nav-link { color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #e2e8f0; }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 12px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          font-family: inherit;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.5); }

        .btn-ghost {
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); }

        .msg-bubble { animation: slideUp 0.4s ease forwards; opacity: 0; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        .feature-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px;
          transition: transform 0.2s, border-color 0.2s, background 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.06);
        }

        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .channel-item {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .channel-item:hover, .channel-item.active { background: rgba(255,255,255,0.08); color: #e2e8f0; }

        .stat-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px 32px;
          text-align: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 999px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float { animation: float 4s ease-in-out infinite; }

        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .shimmer-text {
          background: linear-gradient(90deg, #6366f1, #a78bfa, #38bdf8, #6366f1);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .typing-cursor { display: inline-block; width: 2px; height: 1em; background: #6366f1; margin-left: 2px; animation: blink 1s step-end infinite; vertical-align: text-bottom; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .cta-section {
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 28px;
          padding: 64px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 20 ? "rgba(15,17,23,0.92)" : "transparent",
        backdropFilter: scrollY > 20 ? "blur(20px)" : "none",
        borderBottom: scrollY > 20 ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s",
        padding: "0 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 68,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18, color: "#e2e8f0" }}>Campp</span>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {["Features", "Pricing", "Docs", "Blog"].map(l => <a key={l} href="#" className="nav-link">{l}</a>)}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="nav-link" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onStart}>Login</button>
          <button className="btn-primary" onClick={onStart} style={{ padding: "9px 22px", fontSize: 14 }}>Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px 48px 80px", position: "relative", overflow: "hidden", maxWidth: 1280, margin: "0 auto" }}>
        {/* Orbs */}
        <div className="glow-orb" style={{ width: 500, height: 500, background: "rgba(99,102,241,0.15)", top: "5%", left: "-10%" }} />
        <div className="glow-orb" style={{ width: 400, height: 400, background: "rgba(139,92,246,0.12)", bottom: "10%", right: "-5%" }} />
        <div className="glow-orb" style={{ width: 300, height: 300, background: "rgba(56,189,248,0.08)", top: "40%", right: "30%" }} />

        {/* Left */}
        <div style={{ flex: 1, maxWidth: 560, position: "relative", zIndex: 2 }}>
          <div className="badge">
            <span style={{ width: 6, height: 6, background: "#34d399", borderRadius: "50%", display: "inline-block" }} className="pulse" />
            Real-time · No delay · Always on
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 68, fontWeight: 800, lineHeight: 1.05, marginBottom: 24, color: "#f1f5f9" }}>
            <span className="shimmer-text">{typedText}</span>
            <span className="typing-cursor" />
          </h1>
          <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.7, marginBottom: 40, maxWidth: 460 }}>
            Campp brings your team together with blazing-fast messaging, voice, and video — all in one beautiful workspace.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={onStart} style={{ padding: "15px 36px", fontSize: 16 }}>
              Start chatting free →
            </button>
            <button className="btn-ghost" style={{ padding: "15px 32px", fontSize: 16 }}>
              Watch demo
            </button>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: "#64748b" }}>No credit card needed · Free forever plan</p>
        </div>

        {/* Right – Chat preview */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
          <div className="float" style={{
            width: 480,
            background: "#1e2130",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
            overflow: "hidden",
          }}>
            {/* Window bar */}
            <div style={{ background: "#161824", padding: "14px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
              <span style={{ marginLeft: 12, fontSize: 13, color: "#64748b", fontWeight: 500 }}># general-chat</span>
            </div>

            {/* App layout */}
            <div style={{ display: "flex", height: 380 }}>
              {/* Sidebar */}
              <div style={{ width: 140, background: "#181b29", padding: "14px 8px", borderRight: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px", marginBottom: 8 }}>My Server</div>
                {CHANNELS.map((c, i) => (
                  <div key={c} className={`channel-item ${i === 0 ? "active" : ""}`}>{c}</div>
                ))}
                <div style={{ marginTop: 16, fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px", marginBottom: 8 }}>Online</div>
                {USERS.map(u => (
                  <div key={u.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 8 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: u.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{u.avatar}</div>
                      <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: u.status === "online" ? "#34d399" : "#fbbf24", border: "1px solid #181b29" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                  </div>
                ))}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                  {MESSAGES.map((msg, i) =>
                    visibleMessages.includes(i) ? (
                      <div key={i} className="msg-bubble" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{msg.avatar}</div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: msg.color }}>{msg.user}</span>
                          <span style={{ fontSize: 10, color: "#475569", marginLeft: 6 }}>{msg.time}</span>
                          <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 2 }}>{msg.text}</p>
                        </div>
                      </div>
                    ) : null
                  )}
                  {visibleMessages.length === MESSAGES.length && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                      {[0,1,2].map(d => (
                        <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: `pulse 1s ease-in-out ${d*0.2}s infinite` }} />
                      ))}
                      <span style={{ fontSize: 11, color: "#64748b" }}>vinh is typing…</span>
                    </div>
                  )}
                </div>
                {/* Input */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder="Message #general-chat"
                      style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 12, fontFamily: "inherit" }}
                    />
                    <span style={{ fontSize: 14 }}>😊</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[["2M+","Active users"], ["99.9%","Uptime SLA"], ["<50ms","Message latency"], ["150+","Countries"]].map(([num, label]) => (
            <div key={label} className="stat-box">
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 800, color: "#e2e8f0", marginBottom: 6 }}>{num}</div>
              <div style={{ fontSize: 14, color: "#64748b" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "40px 48px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="badge" style={{ margin: "0 auto 20px" }}>Why Campp</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 800, color: "#f1f5f9", marginBottom: 16 }}>Everything your team needs</h2>
          <p style={{ fontSize: 17, color: "#64748b", maxWidth: 500, margin: "0 auto" }}>Built for speed, designed for humans. No bloat, just great conversations.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { icon: "⚡", title: "Instant delivery", desc: "Tin nhắn và trạng thái được cập nhật realtime tức thời qua WebSockets." },
            { icon: "🔒", title: "Bảo mật JWT", desc: "Hệ thống xác thực và ủy quyền an toàn với JSON Web Tokens." },
            { icon: "🌐", title: "Servers & channels", desc: "Tổ chức không gian linh hoạt với Server, Category và Text/Voice Channels." },
            { icon: "👥", title: "Bạn bè & DM", desc: "Thêm bạn bè, xem trạng thái trực tuyến và nhắn tin riêng tư dễ dàng." },
            { icon: "🎙️", title: "Voice & Video Call", desc: "Tích hợp phòng thoại mượt mà và gọi video cá nhân bằng WebRTC." },
            { icon: "🛡️", title: "Role Permissions", desc: "Hệ thống phân quyền chi tiết cho Owner, Admin và quản lý thành viên." },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 48px 120px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="cta-section">
          <div className="glow-orb" style={{ width: 400, height: 400, background: "rgba(99,102,241,0.2)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 800, color: "#f1f5f9", marginBottom: 20 }}>
              Ready to start talking?
            </h2>
            <p style={{ fontSize: 18, color: "#94a3b8", marginBottom: 40, maxWidth: 440, margin: "0 auto 40px" }}>
              Join over 2 million users who've already switched to a better way to chat.
            </p>
            <button className="btn-primary" onClick={onStart} style={{ padding: "18px 48px", fontSize: 17 }}>
              Create your free server →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 48px", maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💬</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#94a3b8" }}>Campp</span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["Privacy", "Terms", "Status", "Help"].map(l => <a key={l} href="#" className="nav-link" style={{ fontSize: 13 }}>{l}</a>)}
        </div>
        <p style={{ fontSize: 13, color: "#475569" }}>© 2026 Campp. Made with ❤️</p>
      </footer>
    </div>
  );
}