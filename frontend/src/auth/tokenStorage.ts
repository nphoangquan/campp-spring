export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY = "rtchat_access_token";
const REFRESH_KEY = "rtchat_refresh_token";

type JwtPayload = {
  email?: string;
  sub?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

function base64UrlDecode(input: string): string {
  // JWT dùng base64url: - _ và không padding =
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return atob(padded);
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadStr = base64UrlDecode(parts[1]);
    return JSON.parse(payloadStr) as JwtPayload;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens(tokens: Tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  },

  /**
   * Lấy email từ accessToken JWT (claim "email" được backend set khi generate access token).
   */
  getEmailFromAccessToken(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = parseJwtPayload(token);
    const email = payload?.email;
    return typeof email === "string" && email.length > 0 ? email : null;
  },

  /**
   * Lấy userId từ accessToken JWT (claim "sub" được backend set khi generate access token).
   */
  getUserIdFromAccessToken(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = parseJwtPayload(token);
    const sub = payload?.sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  },
};
