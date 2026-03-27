import type { CategoryResponse } from "./type";
import type { ChannelType } from "../../api/serverApi";
// import type { CategoryResponse, ChannelType } from "./types";

export default function CreateChannelCard(props: {
  categories: CategoryResponse[];

  chName: string;
  setChName: (v: string) => void;
  chType: ChannelType;
  setChType: (v: ChannelType) => void;
  chPos: number;
  setChPos: (v: number) => void;
  chCategoryId: string;
  setChCategoryId: (v: string) => void;

  onCreateChannel: () => void;
}) {
  return (
    <div className="app-card">
      <div className="app-title">Create Channel</div>
      <div className="app-sub">
        Channel có thể thuộc category hoặc để trống.
      </div>

      <div className="app-field">
        <label>Name</label>
        <input
          value={props.chName}
          onChange={(e) => props.setChName(e.target.value)}
        />
      </div>

      <div className="app-field">
        <label>Type</label>
        <select
          value={props.chType}
          onChange={(e) => props.setChType(e.target.value as ChannelType)}
        >
          <option value="TEXT">TEXT</option>
          <option value="VOICE">VOICE</option>
        </select>
      </div>

      <div className="app-field">
        <label>Position</label>
        <input
          value={props.chPos}
          onChange={(e) => props.setChPos(Number(e.target.value))}
        />
      </div>

      <div className="app-field">
        <label>Category (optional)</label>
        <select
          value={props.chCategoryId}
          onChange={(e) => props.setChCategoryId(e.target.value)}
        >
          <option value="">(no category)</option>
          {props.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.id.slice(0, 6)}...)
            </option>
          ))}
        </select>
      </div>

      <button
        className="app-btn primary"
        onClick={props.onCreateChannel}
        type="button"
      >
        Create Channel
      </button>
    </div>
  );
}
