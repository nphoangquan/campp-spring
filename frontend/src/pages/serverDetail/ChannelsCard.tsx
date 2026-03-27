import type { ChannelResponse } from "./type";

export default function ChannelsCard(props: {
  channels: ChannelResponse[];
  categoryLabel: (categoryId: string | null) => string;
  onUpdateChannel: (ch: ChannelResponse) => void;
  onDeleteChannel: (ch: ChannelResponse) => void;
}) {
  return (
    <div className="app-card" style={{ marginTop: 12 }}>
      <div className="app-title">Channels</div>
      <div className="app-sub">
        List channel của server (OWNER mới update/delete).
      </div>

      <ul className="app-list">
        {props.channels.map((ch) => (
          <li key={ch.id} className="app-item">
            <div>
              <div className="app-item-title">
                {ch.name} <span className="app-pill">{ch.type}</span>
              </div>
              <div className="app-item-sub">
                <span className="app-pill">pos {ch.position}</span>{" "}
                <span className="app-pill">
                  {props.categoryLabel(ch.categoryId)}
                </span>{" "}
                <span className="code-like">id: {ch.id}</span>
              </div>
            </div>

            <div className="app-mini-actions">
              <button
                className="app-btn"
                onClick={() => props.onUpdateChannel(ch)}
                type="button"
              >
                Edit
              </button>
              <button
                className="app-btn danger"
                onClick={() => props.onDeleteChannel(ch)}
                type="button"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {props.channels.length === 0 && (
        <div className="app-msg ok">Chưa có channel nào.</div>
      )}
    </div>
  );
}
