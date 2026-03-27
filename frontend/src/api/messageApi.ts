import { http } from "./http";

export type MessageResponse = {
  id: string;
  serverId: string;
  channelId: string;

  senderId: string;
  senderEmail: string;

  content: string;
  replyToMessageId?: string | null;

  deleted: boolean;
  pinned?: boolean;
  reactions?: Record<string, string[]>;
  reactionUsernames?: Record<string, string[]>;

  createdAt: string; // ISO
  editedAt?: string | null;
};

export type MessagePageResponse = {
  items: MessageResponse[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

/**
 * GET /api/messages/channel/{channelId}?page=0&size=50
 */
export function getChannelMessages(channelId: string, page = 0, size = 50) {
  // Lưu ý: wrapper http của bạn auto gắn Authorization và auto refresh token.
  return http<MessagePageResponse>(
    `/api/messages/channel/${channelId}?page=${page}&size=${size}`,
    {
      method: "GET",
      auth: true,
    },
  );
}

export const messageApi = {
  getChannelMessages,
  
  react: (messageId: string, emoji: string, isAdding: boolean): Promise<MessageResponse> =>
    http(`/api/messages/${messageId}/react?emoji=${encodeURIComponent(emoji)}&isAdding=${isAdding}`, { method: "POST" }),

  pin: (messageId: string, pin: boolean): Promise<MessageResponse> =>
    http(`/api/messages/${messageId}/pin?pin=${pin}`, { method: "PUT" }),

  delete: (messageId: string): Promise<MessageResponse> =>
    http(`/api/messages/${messageId}`, { method: "DELETE" }),
};
