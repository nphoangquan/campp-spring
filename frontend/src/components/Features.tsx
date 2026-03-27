

type Feature = {
  title: string;
  desc: string;
  tag: string;
};

const FEATURES: Feature[] = [
  {
    title: "Auth + JWT",
    desc: "Register/Login với JWT access + refresh token, stateless, BCrypt.",
    tag: "Phase 1",
  },
  {
    title: "Server / Channel",
    desc: "CRUD server, category, text channel; lịch sử tin nhắn có pagination.",
    tag: "Phase 2",
  },
  {
    title: "Realtime Messaging",
    desc: "WebSocket STOMP, subscribe theo topic /server/{id}/channel/{id}.",
    tag: "Phase 3",
  },
  {
    title: "Role & Permission",
    desc: "Owner/Admin/Moderator/Member, permission override theo channel (Deny > Allow).",
    tag: "Phase 4",
  },
  {
    title: "Presence + DM",
    desc: "Online/Offline, last seen, friend list & direct messages realtime.",
    tag: "Phase 5",
  },
  {
    title: "Moderation + Search",
    desc: "Mute/Kick/Ban/Timeout + log; search messages có index MongoDB.",
    tag: "Phase 6",
  },
];

export default function Features() {
  return (
    <>
      <section className="lp-section" id="features">
        <h2 className="lp-h2">Tính năng theo spec</h2>
        <p className="lp-p">
          Các module chính bám theo đặc tả: Auth, Server/Channel, realtime
          messaging (STOMP), role/permission, presence/DM, moderation/search.
        </p>

        <div className="lp-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-card">
              <div className="lp-tag">{f.tag}</div>
              <div className="lp-card-title">{f.title}</div>
              <div className="lp-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" id="roadmap">
        <h2 className="lp-h2">Lộ trình triển khai</h2>
        <p className="lp-p">
          Khi landing page chạy ổn, ta sẽ bắt đầu Phase 1 đúng spec: Auth + User
          model + Basic security.
        </p>

        <ol className="lp-ol">
          <li>
            <b>Phase 1:</b> Auth, User model, JWT, Security config
          </li>
          <li>
            <b>Phase 2:</b> Server + Channel CRUD + MongoDB schema
          </li>
          <li>
            <b>Phase 3:</b> Realtime text messaging (WebSocket STOMP)
          </li>
          <li>
            <b>Phase 4:</b> Role & Permission system
          </li>
          <li>
            <b>Phase 5–7:</b> Presence/DM, Search/Moderation, Voice (optional)
          </li>
        </ol>
      </section>
    </>
  );
}
