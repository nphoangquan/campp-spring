import { tokenStorage } from "../auth/tokenStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // default true
};

let refreshingPromise: Promise<boolean> | null = null;

async function refreshTokenOnce(): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data?.accessToken || !data?.refreshToken) return false;

      // IMPORTANT: refresh rotate => 반드시 lưu refreshToken mới
      tokenStorage.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errJson = await res.json();
      if (errJson?.message) return String(errJson.message);
      return JSON.stringify(errJson);
    }
    const t = await res.text();
    return t || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function http<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const auth = options.auth ?? true;

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  let body: BodyInit | undefined = undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(options.body);
  }

  const doRequest = async (): Promise<Response> => {
    if (auth) {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      else delete headers["Authorization"];
    }
    return fetch(`${API_BASE_URL}${path}`, { method, headers, body });
  };

  // 1) Request lần đầu
  let res = await doRequest();

  // 2) Nếu 401/403 (token hết hạn hoặc invalid) => thử refresh 1 lần rồi retry
  if (
    (res.status === 401 || res.status === 403) &&
    auth &&
    tokenStorage.getRefreshToken()
  ) {
    const ok = await refreshTokenOnce();
    if (ok) {
      res = await doRequest();
    } else {
      // refresh fail => clear token để App tự đá về landing
      tokenStorage.clear();
      const msg = await readErrorMessage(res);
      throw new Error(`Session hết hạn. Vui lòng đăng nhập lại. (${msg})`);
    }
  }

  // 3) Handle error
  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new Error(msg);
  }

  // 4) Return JSON / empty
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    // @ts-expect-error allow empty response
    return undefined;
  }

  return (await res.json()) as T;
}
