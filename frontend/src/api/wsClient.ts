import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { tokenStorage } from "../auth/tokenStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export type WsOptions = {
  /**
   * Nếu backend bật withSockJS() thì set true để dùng SockJS.
   * Mặc định false => dùng native WebSocket (không cần sockjs-client).
   */
  useSockJS?: boolean;
};

export class WsChatClient {
  private client: Client | null = null;
  private connectPromise: Promise<void> | null = null;

  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  async connect(opts?: WsOptions): Promise<void> {
    if (this.connected) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise(async (resolve, reject) => {
      try {
        const token = tokenStorage.getAccessToken();
        const useSockJS = opts?.useSockJS ?? false;

    const wsHttpEndpoint = `${API_BASE_URL}/ws`;
    const brokerURL = this.toWsUrl(wsHttpEndpoint);

    // ✅ Chỉ tạo SockJS khi cần để tránh crash "global is not defined"
    let webSocketFactory: (() => WebSocket) | undefined = undefined;

    if (useSockJS) {
      const mod = await import("sockjs-client");
      const SockJS = mod.default;
      webSocketFactory = () =>
        new SockJS(wsHttpEndpoint) as unknown as WebSocket;
    }

        this.client = new Client({
          brokerURL: useSockJS ? undefined : brokerURL,
          webSocketFactory,
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          reconnectDelay: 3000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          debug: () => {
            // bật nếu cần debug
            // console.log(str);
          },
        });

        this.client.onConnect = () => {
          // Clear connectPromise so future connect attempts after disconnect create a new one
          this.connectPromise = null;
          resolve();
        };
        this.client.onStompError = (frame) => {
           this.connectPromise = null;
           reject(new Error(frame.headers["message"] || "STOMP error"));
        };
        this.client.onWebSocketError = () => {
           this.connectPromise = null;
           // Không reject() ngay đây nếu có reconnectDelay? 
           // Tạm thời nếu ko kết nối được lần đầu mới reject.
           reject(new Error("WebSocket error"));
        };
        
        this.client.onWebSocketClose = () => {
           this.connectPromise = null;
        };

        this.client.activate();
      } catch (error) {
         this.connectPromise = null;
         reject(error);
      }
    });

    return this.connectPromise;
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    await this.client.deactivate();
    this.client = null;
    this.connectPromise = null;
  }

  subscribe(topic: string, onMessage: (msg: IMessage) => void): StompSubscription {
    if (!this.client || !this.client.connected) {
      throw new Error("WS not connected");
    }
    return this.client.subscribe(topic, onMessage);
  }

  publish(destination: string, body: unknown) {
    if (!this.client || !this.client.connected) {
      throw new Error("WS not connected");
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  private toWsUrl(httpUrl: string) {
    if (httpUrl.startsWith("https://"))
      return httpUrl.replace("https://", "wss://");
    if (httpUrl.startsWith("http://"))
      return httpUrl.replace("http://", "ws://");
    return httpUrl;
  }
}

export const globalWsClient = new WsChatClient();
