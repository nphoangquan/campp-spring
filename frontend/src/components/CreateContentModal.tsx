import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { serverApi, type CategoryResponse, type ChannelType } from "../api/serverApi";

interface CreateContentModalProps {
  serverId: string;
  categories: CategoryResponse[];
  initialMode?: "choice" | "category" | "channel";
  initialCategoryId?: string | null;
  onClose: () => void;
  onCreated: () => void;
}

type ModalView = "choice" | "category" | "channel";

export default function CreateContentModal({
  serverId,
  categories,
  initialMode = "choice",
  initialCategoryId = null,
  onClose,
  onCreated
}: CreateContentModalProps) {
  const [view, setView] = useState<ModalView>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Category State
  const [categoryName, setCategoryName] = useState("");

  // Channel State
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("TEXT");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await serverApi.createCategory(serverId, { name: categoryName.trim() });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !selectedCategoryId) {
      if (!selectedCategoryId) setError("A channel must belong to a category");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await serverApi.createChannel(serverId, {
        name: channelName.trim(),
        type: channelType,
        categoryId: selectedCategoryId
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {view === "choice" && (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Create New</h2>
              <p className="modal-sub">Choose what you want to add to your server</p>
            </div>
            <div className="modal-body">
              <div className="choice-box">
                <div className="choice-button" onClick={() => setView("category")}>
                  <span className="choice-label">Create Category</span>
                  <ChevronRight size={20} color="#B5BAC1" />
                </div>
                <div className="choice-button" onClick={() => setView("channel")}>
                  <span className="choice-label">Create Channel</span>
                  <ChevronRight size={20} color="#B5BAC1" />
                </div>
              </div>
            </div>
          </>
        )}

        {view === "category" && (
          <form onSubmit={handleCreateCategory}>
            <div className="modal-header">
              <h2 className="modal-title">Create Category</h2>
              <p className="modal-sub">Categories help organize your channels</p>
            </div>
            <div className="modal-body">
              <label className="form-label">Category Name</label>
              <input
                className="modal-input"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
                autoFocus
              />
              {error && <p style={{ color: "#fa777c", fontSize: "12px", marginTop: "8px" }}>{error}</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn-link" onClick={() => setView("choice")}>Back</button>
              <button type="submit" className="modal-btn-primary" disabled={loading || !categoryName.trim()}>
                {loading ? "Creating..." : "Create Category"}
              </button>
            </div>
          </form>
        )}

        {view === "channel" && (
          <form onSubmit={handleCreateChannel}>
            <div className="modal-header">
              <h2 className="modal-title">Create Channel</h2>
              <p className="modal-sub">Create a place for your server members to talk</p>
            </div>
            <div className="modal-body">
              <label className="form-label">Channel Type</label>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <button
                  type="button"
                  onClick={() => setChannelType("TEXT")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #1E1F22",
                    backgroundColor: channelType === "TEXT" ? "#404249" : "#2B2D31",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setChannelType("VOICE")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #1E1F22",
                    backgroundColor: channelType === "VOICE" ? "#404249" : "#2B2D31",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  Voice
                </button>
              </div>

              <label className="form-label">Channel Name</label>
              <input
                className="modal-input"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="new-channel"
                autoFocus
              />

              <label className="form-label" style={{ marginTop: "16px" }}>Category</label>
              <select
                className="modal-input"
                value={selectedCategoryId || ""}
                onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                style={{ appearance: "none" }}
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              {error && <p style={{ color: "#fa777c", fontSize: "12px", marginTop: "8px" }}>{error}</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn-link" onClick={() => setView("choice")}>Back</button>
              <button type="submit" className="modal-btn-primary" disabled={loading || !channelName.trim() || !selectedCategoryId}>
                {loading ? "Creating..." : "Create Channel"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
