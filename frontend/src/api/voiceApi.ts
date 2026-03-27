import { http } from "./http";

export type VoiceParticipantDTO = {
  userId: string;
  username: string;
  hasAvatar: boolean;
  micOn: boolean;
  camOn: boolean;
  screenShareOn: boolean;
};

export const voiceApi = {
  joinChannel: async (
    channelId: string,
    initialState: { micOn: boolean; camOn: boolean; screenShareOn: boolean }
  ): Promise<VoiceParticipantDTO[]> => {
    return http(`/api/voice/channels/${channelId}/join`, {
      method: "POST",
      body: initialState,
    });
  },

  leaveChannel: async (channelId: string): Promise<{ message: string }> => {
    return http(`/api/voice/channels/${channelId}/leave`, {
      method: "POST",
    });
  },
};
