import type { MessageResponse } from "../../api/messageApi";
import type {
  CategoryResponse,
  ChannelResponse,
  ServerResponse,
} from "../../api/serverApi";

export type WsStatus = "idle" | "connecting" | "connected" | "error";

export type {
  CategoryResponse,
  ChannelResponse,
  ServerResponse,
  MessageResponse,
};
