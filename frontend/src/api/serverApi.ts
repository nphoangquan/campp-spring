import { http } from "./http";

export type ServerResponse = {
  id: string;
  ownerId: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
};

export type ServerListItemResponse = {
  id: string;
  name: string;
  role: string; // OWNER / MEMBER / ...
};

export type ServerMemberResponse = {
  userId: string;
  username: string;
  role: string;
  joinedAt: string;
};

export type JoinLeaveResponse = {
  message: string;
};

export type CategoryResponse = {
  id: string;
  serverId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type ChannelType = "TEXT" | "VOICE";

export type ChannelResponse = {
  id: string;
  serverId: string;
  categoryId: string | null;
  name: string;
  type: ChannelType;
  position: number;
  hasActiveVoice: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RolePermissionsResponse = {
  role: string;
  permissions: string[];
  isDefault: boolean;
};

export const serverApi = {
  // Servers
  createServer(name: string) {
    return http<ServerResponse>("/servers", {
      method: "POST",
      body: { name },
      auth: true,
    });
  },
  myServers() {
    return http<ServerListItemResponse[]>("/servers/me", {
      method: "GET",
      auth: true,
    });
  },
  getServer(serverId: string) {
    return http<ServerResponse>(`/servers/${serverId}`, {
      method: "GET",
      auth: true,
    });
  },
  updateServer(serverId: string, name: string) {
    return http<ServerResponse>(`/servers/${serverId}`, {
      method: "PATCH",
      body: { name },
      auth: true,
    });
  },
  deleteServer(serverId: string) {
    return http<{ message: string }>(`/servers/${serverId}`, {
      method: "DELETE",
      auth: true,
    });
  },
  joinServer(serverId: string) {
    return http<JoinLeaveResponse>(`/servers/${serverId}/join`, {
      method: "POST",
      auth: true,
    });
  },
  leaveServer(serverId: string) {
    return http<JoinLeaveResponse>(`/servers/${serverId}/leave`, {
      method: "POST",
      auth: true,
    });
  },
  joinByInvite(inviteCode: string) {
    return http<JoinLeaveResponse>("/servers/join-by-invite", {
      method: "POST",
      body: { inviteCode },
      auth: true,
    });
  },

  // Categories
  listCategories(serverId: string) {
    return http<CategoryResponse[]>(`/servers/${serverId}/categories`, {
      method: "GET",
      auth: true,
    });
  },
  createCategory(
    serverId: string,
    payload: { name: string; position?: number },
  ) {
    return http<CategoryResponse>(`/servers/${serverId}/categories`, {
      method: "POST",
      body: payload,
      auth: true,
    });
  },
  updateCategory(
    serverId: string,
    categoryId: string,
    payload: { name: string; position?: number },
  ) {
    return http<CategoryResponse>(
      `/servers/${serverId}/categories/${categoryId}`,
      {
        method: "PATCH",
        body: payload,
        auth: true,
      },
    );
  },
  deleteCategory(serverId: string, categoryId: string) {
    return http<{ message: string }>(
      `/servers/${serverId}/categories/${categoryId}`,
      {
        method: "DELETE",
        auth: true,
      },
    );
  },

  // Channels
  listChannels(serverId: string) {
    return http<ChannelResponse[]>(`/servers/${serverId}/channels`, {
      method: "GET",
      auth: true,
    });
  },
  createChannel(
    serverId: string,
    payload: {
      name: string;
      type?: ChannelType;
      categoryId?: string | null;
      position?: number;
    },
  ) {
    return http<ChannelResponse>(`/servers/${serverId}/channels`, {
      method: "POST",
      body: payload,
      auth: true,
    });
  },
  updateChannel(
    serverId: string,
    channelId: string,
    payload: {
      name: string;
      type?: ChannelType;
      categoryId?: string | null;
      position?: number;
    },
  ) {
    return http<ChannelResponse>(`/servers/${serverId}/channels/${channelId}`, {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },
  deleteChannel(serverId: string, channelId: string) {
    return http<{ message: string }>(
      `/servers/${serverId}/channels/${channelId}`,
      {
        method: "DELETE",
        auth: true,
      },
    );
  },

  // Members
  getServerMembers(serverId: string) {
    return http<ServerMemberResponse[]>(`/servers/${serverId}/members`, {
      method: "GET",
      auth: true,
    });
  },
  updateMemberRole(serverId: string, targetUserId: string, role: string) {
    return http<{ message: string }>(`/servers/${serverId}/members/${targetUserId}/role`, {
      method: "PUT",
      body: { role },
      auth: true,
    });
  },
  kickMember(serverId: string, targetUserId: string) {
    return http<{ message: string }>(`/servers/${serverId}/members/${targetUserId}`, {
      method: "DELETE",
      auth: true,
    });
  },

  // Role Permissions
  getRolePermissions(serverId: string) {
    return http<RolePermissionsResponse[]>(`/servers/${serverId}/role-permissions`, {
      method: "GET",
      auth: true,
    });
  },
  updateRolePermissions(serverId: string, role: string, permissions: string[]) {
    return http<RolePermissionsResponse>(`/servers/${serverId}/role-permissions/${role}`, {
      method: "PUT",
      body: { permissions },
      auth: true,
    });
  },
};
