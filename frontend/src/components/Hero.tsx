

type MetricProps = {
  title: string;
  value: string;
  sub: string;
};

type ChatLineProps = {
  name: string;
  text: string;
  dim?: boolean;
};

function Metric({ title, value, sub }: MetricProps) {
  return (
    <div className="lp-metric">
      <div className="lp-metric-title">{title}</div>
      <div className="lp-metric-value">{value}</div>
      <div className="lp-metric-sub">{sub}</div>
    </div>
  );
}

function ChatLine({ name, text, dim }: ChatLineProps) {
  return (
    <div className={`lp-chatline ${dim ? "is-dim" : ""}`}>
      <span className="lp-chatline-name">{name}:</span>
      <span className="lp-chatline-text">{text}</span>
    </div>
  );
}

export default function Hero(props: { onStart: () => void }) {
  return (
    <section className="lp-hero" id="start">
      <div className="lp-hero-left">
        <div className="lp-badge">
          Spring Boot • React • MongoDB • WebSocket
        </div>

        <h1 className="lp-title">
          Website Chat Realtime{" "}
          <span className="lp-title-accent">giống Discord</span>, dễ mở rộng
        </h1>

        <p className="lp-desc">
          Xây dựng hệ thống chat realtime với REST API + WebSocket (STOMP), hỗ
          trợ Server/Channel, Role/Permission, DM, presence và moderation theo
          đúng đặc tả dự án.
        </p>

        <div className="lp-cta">
          <a className="lp-btn lp-btn-ghost" href="#features">
            Khám phá tính năng
          </a>

          <button
            type="button"
            className="lp-btn lp-btn-primary"
            onClick={props.onStart}
            style={{ cursor: "pointer" }}
          >
            Bắt đầu ngay
          </button>
        </div>

        <div className="lp-metrics">
          <Metric title="Realtime" value="STOMP" sub="topic-based subscribe" />
          <Metric title="Bảo mật" value="JWT" sub="stateless + RBAC" />
          <Metric title="DB" value="MongoDB" sub="paginate + index" />
        </div>
      </div>

      <div className="lp-hero-right" aria-hidden="true">
        <div className="lp-mock">
          <div className="lp-mock-header">
            <span className="lp-dot" />
            <span className="lp-dot" />
            <span className="lp-dot" />
            <span className="lp-mock-title">#general</span>
          </div>

          <div className="lp-mock-body">
            <ChatLine name="Khanh" text="Hello team 👋 ready for realtime?" />
            <ChatLine
              name="Bot"
              text="Connected to /topic/server/1/channel/1 ✅"
              dim
            />
            <ChatLine name="Huy" text="Role/Permission tới phase 4 nha!" />
            <ChatLine name="Khanh" text="Ok, hôm nay dựng landing trước 😄" />
          </div>

          <div className="lp-mock-footer">
            <div className="lp-input-fake">Type a message…</div>
            <div className="lp-send-fake">➤</div>
          </div>
        </div>
      </div>
    </section>
  );
}
