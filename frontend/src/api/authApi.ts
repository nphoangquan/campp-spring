import { http } from "./http";

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type VerifyRequest = {
  email: string;
  code: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type MeResponse = {
  userId: string;
  authorities: Array<{ authority: string }>;
};

export const authApi = {
  register(req: RegisterRequest) {
    return http<{ message: string }>("/auth/register", {
      method: "POST",
      body: req,
      auth: false,
    });
  },
  verify(req: VerifyRequest) {
    return http<{ message: string }>("/auth/verify", {
      method: "POST",
      body: req,
      auth: false,
    });
  },
  login(req: LoginRequest) {
    return http<AuthResponse>("/auth/login", {
      method: "POST",
      body: req,
      auth: false,
    });
  },
  forgotPassword(req: ForgotPasswordRequest) {
    return http<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: req,
      auth: false,
    });
  },
  resetPassword(req: ResetPasswordRequest) {
    return http<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: req,
      auth: false,
    });
  },
  refresh(refreshToken: string) {
    return http<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      auth: false,
    });
  },
  me() {
    return http<MeResponse>("/me", { method: "GET", auth: true });
  },
  health() {
    return http<{ status: string }>("/health", { method: "GET", auth: false });
  },
};
