import { http } from "./http";

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type FriendResponse = {
  friendshipId: string;
  userId: string;
  username: string;
  status: FriendshipStatus;
  createdAt: string;
};

export type UserSearchResult = {
  userId: string;
  username: string;
};

export const friendApi = {
  /** Tìm user theo username */
  searchByUsername: (username: string): Promise<UserSearchResult> =>
    http(`/api/friends/search?username=${encodeURIComponent(username)}`),

  /** Gửi lời mời kết bạn */
  sendRequest: (receiverId: string): Promise<FriendResponse> =>
    http("/api/friends/request", { method: "POST", body: { receiverId } }),

  /** Chấp nhận lời mời */
  accept: (friendshipId: string): Promise<FriendResponse> =>
    http(`/api/friends/${friendshipId}/accept`, { method: "PUT" }),

  /** Từ chối lời mời */
  reject: (friendshipId: string): Promise<void> =>
    http(`/api/friends/${friendshipId}/reject`, { method: "PUT" }),

  /** Xoá bạn / huỷ lời mời */
  remove: (friendshipId: string): Promise<void> =>
    http(`/api/friends/${friendshipId}`, { method: "DELETE" }),

  /** Danh sách bạn bè (ACCEPTED) */
  listFriends: (): Promise<FriendResponse[]> => http("/api/friends"),

  /** Lời mời kết bạn đến */
  listIncoming: (): Promise<FriendResponse[]> =>
    http("/api/friends/pending/incoming"),

  /** Lời mời kết bạn đã gửi */
  listOutgoing: (): Promise<FriendResponse[]> =>
    http("/api/friends/pending/outgoing"),
};
