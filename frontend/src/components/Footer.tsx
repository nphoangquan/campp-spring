

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <div className="lp-footer-left">
          <div className="lp-footer-brand">💬 Realtime Chat</div>
          <div className="lp-footer-sub">
            Built with Spring Boot + React + MongoDB (WebSocket STOMP).
          </div>
        </div>

        <div className="lp-footer-right">
          <span className="lp-footer-small">
            © {new Date().getFullYear()} • MVP first
          </span>
        </div>
      </div>
    </footer>
  );
}
