import { http } from "./http";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export type UserProfileResponse = {
  id: string;
  username: string;
  email: string;
  hasAvatar: boolean;
};

export type UpdateProfileRequest = {
  username?: string;
};

export const userApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    return http("/api/users/me");
  },

  updateProfile: async (req: UpdateProfileRequest): Promise<UserProfileResponse> => {
    return http("/api/users/me/profile", {
      method: "PUT",
      body: req,
    });
  },

  requestDeleteOtp: async (): Promise<{ message: string }> => {
    return http("/api/users/me/delete-otp", {
      method: "POST",
    });
  },

  deleteAccount: async (req: { code: string }): Promise<{ message: string }> => {
    return http("/api/users/me", {
      method: "DELETE",
      body: req,
    });
  },

  uploadAvatar: async (file: File): Promise<UserProfileResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const { tokenStorage } = await import("../auth/tokenStorage");
    const token = tokenStorage.getAccessToken();

    const res = await fetch(`${API_BASE_URL}/api/users/me/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Upload ảnh thất bại");
    }
    return res.json();
  },

  getAvatarUrl: (userId: string, timestamp?: number | string): string => {
    const base = `${API_BASE_URL}/api/users/${userId}/avatar`;
    return timestamp ? `${base}?t=${timestamp}` : base;
  },
};
