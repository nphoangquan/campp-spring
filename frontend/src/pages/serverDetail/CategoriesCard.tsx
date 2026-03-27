import type { CategoryResponse } from "./type";
// import type { CategoryResponse } from "./types";

export default function CategoriesCard(props: {
  categories: CategoryResponse[];
  onUpdateCategory: (c: CategoryResponse) => void;
  onDeleteCategory: (c: CategoryResponse) => void;
}) {
  return (
    <div className="app-card">
      <div className="app-title">Categories</div>
      <div className="app-sub">
        List category của server (OWNER mới update/delete).
      </div>

      <ul className="app-list">
        {props.categories.map((c) => (
          <li key={c.id} className="app-item">
            <div>
              <div className="app-item-title">{c.name}</div>
              <div className="app-item-sub">
                <span className="app-pill">pos {c.position}</span>{" "}
                <span className="code-like">id: {c.id}</span>
              </div>
            </div>
            <div className="app-mini-actions">
              <button
                className="app-btn"
                onClick={() => props.onUpdateCategory(c)}
                type="button"
              >
                Edit
              </button>
              <button
                className="app-btn danger"
                onClick={() => props.onDeleteCategory(c)}
                type="button"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {props.categories.length === 0 && (
        <div className="app-msg ok">Chưa có category nào.</div>
      )}
    </div>
  );
}
