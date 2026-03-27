

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Tính năng", href: "#features" },
  { label: "Lộ trình", href: "#roadmap" },
];

export default function Navbar(props: { onStart: () => void }) {
  return (
    <header className="lp-nav">
      <div className="lp-container lp-nav-inner">
        <div className="lp-brand" aria-label="Realtime Chat">
          <span className="lp-logo" aria-hidden="true">
            💬
          </span>
          <span className="lp-brand-text">Realtime Chat</span>
        </div>

        <nav className="lp-nav-links" aria-label="Primary navigation">
          {NAV.map((item) => (
            <a key={item.href} className="lp-link" href={item.href}>
              {item.label}
            </a>
          ))}

          <button
            type="button"
            className="lp-link lp-link-primary"
            onClick={props.onStart}
            style={{ cursor: "pointer" }}
          >
            Bắt đầu
          </button>
        </nav>
      </div>
    </header>
  );
}
