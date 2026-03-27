import { http } from "./http";

export type PresenceStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DND" | "INVISIBLE";

export type PresenceResponse = {
  userId: string;
  username: string;
  status: PresenceStatus;
  manualStatus?: PresenceStatus;
  lastSeen?: string;
  activityMessage?: string;
};

export const presenceApi = {
  /** Lấy presence của 1 user */
  getPresence: (userId: string): Promise<PresenceResponse> =>
    http(`/api/presence/${userId}`),

  /** Lấy presence của nhiều user */
  getBulk: (userIds: string[]): Promise<PresenceResponse[]> =>
    http("/api/presence/bulk", { method: "POST", body: { userIds } }),

  /** Cập nhật activity message cá nhân */
  updateActivity: (activityMessage: string): Promise<void> =>
    http("/api/presence/activity", { method: "PUT", body: { activityMessage } }),

  /** Cập nhật trạng thái trực tuyến thủ công */
  updateStatus: (status: PresenceStatus | null): Promise<void> =>
    http("/api/presence/status", { method: "PUT", body: { status } }),
};
