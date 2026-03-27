import { http } from "./http";

export type DmResponse = {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  content: string;
  replyToMessageId?: string | null;
  pinned?: boolean;
  reactions?: Record<string, string[]>;
  reactionUsernames?: Record<string, string[]>;
  deleted: boolean;
  createdAt: string;
  editedAt?: string;
};

export type DmPageResponse = {
  items: DmResponse[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type BlockStatusResponse = {
  blocked: boolean;
  blocker: boolean;
  blockerUsername: string | null;
};

export const dmApi = {
  /** Lấy lịch sử DM với user khác */
  getHistory: (otherId: string, page = 0, size = 30): Promise<DmPageResponse> =>
    http(`/api/dm/${otherId}/history?page=${page}&size=${size}`),

  react: (messageId: string, emoji: string, isAdding: boolean): Promise<DmResponse> =>
    http(`/api/dm/${messageId}/react?emoji=${encodeURIComponent(emoji)}&isAdding=${isAdding}`, { method: "POST" }),

  pin: (messageId: string, pin: boolean): Promise<DmResponse> =>
    http(`/api/dm/${messageId}/pin?pin=${pin}`, { method: "PUT" }),

  delete: (messageId: string): Promise<DmResponse> =>
    http(`/api/dm/${messageId}`, { method: "DELETE" }),

  getBlockStatus: (otherId: string): Promise<BlockStatusResponse> =>
    http(`/api/dm/${otherId}/block-status`),

  blockUser: (otherId: string): Promise<void> =>
    http(`/api/dm/${otherId}/block`, { method: "POST" }),

  unblockUser: (otherId: string): Promise<void> =>
    http(`/api/dm/${otherId}/unblock`, { method: "POST" }),
};
