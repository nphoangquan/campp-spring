import { useEffect, useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
} from "lucide-react";
import { type StompSubscription } from "@stomp/stompjs";
import { globalWsClient } from "../api/wsClient";
import { voiceApi, type VoiceParticipantDTO } from "../api/voiceApi";
import { userApi } from "../api/userApi";
import { tokenStorage } from "../auth/tokenStorage";

// Giả định component chứa logic mock cho chức năng Video/Audio
// Trong thực tế sẽ cần logic WebRTC (RTCPeerConnection) phức tạp để stream Media.
// Yêu cầu chỉ tập trung vào UI Grid và trạng thái hiển thị nên ta làm layout UI.

export default function VoiceChannelContent({
  channelId,
  onLeave,
}: {
  channelId: string;
  onLeave: () => void;
}) {
  const [participants, setParticipants] = useState<VoiceParticipantDTO[]>([]);
  const [myState, setMyState] = useState({
    micOn: true,
    camOn: false,
    screenShareOn: false,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const subRef = useRef<StompSubscription | null>(null);

  // Avatar cache buster
  const [avatarTs] = useState(Date.now());

  // WebRTC Setup
  const currentUserId = tokenStorage.getUserIdFromAccessToken() || "unknown";
  const myStreamRef = useRef<MediaStream | null>(null);
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<any>(null);
  const callsRef = useRef<Record<string, any>>({});
  // Track whether PeerJS + WS are fully ready before attempting outgoing calls
  const peerReadyRef = useRef(false);

  // Storage for incoming MediaStreams
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});

  // Helper: call a peer with retry logic. PeerJS may fail if the remote peer
  // hasn't fully registered on the PeerServer yet.
  const callPeerWithRetry = (
    peer: any,
    targetUserId: string,
    targetPeerId: string,
    stream: MediaStream,
    retries = 5,
    delayMs = 1200,
  ) => {
    // Skip if we already have a call to this user (e.g. from incoming)
    if (callsRef.current[targetUserId]) return;

    const attempt = (remaining: number) => {
      // Don't retry if we already got an incoming call from this user
      if (callsRef.current[targetUserId]) return;
      // Don't retry if peer was destroyed
      if (peer.destroyed || peer.disconnected) return;

      console.log(
        `[PeerJS] Calling ${targetPeerId} (attempt ${retries - remaining + 1}/${retries})`,
      );
      try {
        const call = peer.call(targetPeerId, stream);
        if (!call) {
          console.warn(
            `[PeerJS] Call to ${targetPeerId} returned undefined, ` +
              (remaining > 0 ? `retrying in ${delayMs}ms...` : "giving up."),
          );
          if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), delayMs);
          }
          return;
        }

        // Success — register the call
        callsRef.current[targetUserId] = call;

        call.on("stream", (remoteStream: MediaStream) => {
          console.log(
            "[PeerJS] Received stream from outgoing call to:",
            targetUserId,
            "Audio:",
            remoteStream.getAudioTracks().length,
            "Video:",
            remoteStream.getVideoTracks().length,
          );
          setRemoteStreams((prev) => ({
            ...prev,
            [targetUserId]: remoteStream,
          }));
        });

        call.on("close", () => {
          console.log("[PeerJS] Outgoing call closed with:", targetUserId);
          delete callsRef.current[targetUserId];
          setRemoteStreams((prev) => {
            const ns = { ...prev };
            delete ns[targetUserId];
            return ns;
          });
        });

        call.on("error", (err: any) => {
          console.error("[PeerJS] Call error with:", targetUserId, err);
          delete callsRef.current[targetUserId];
          // Retry on error if we have remaining attempts
          if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), delayMs);
          }
        });
      } catch (err) {
        console.error("[PeerJS] Failed to initiate call:", err);
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), delayMs);
        }
      }
    };

    attempt(retries);
  };

  useEffect(() => {
    let active = true;

    // Join channel
    const join = async () => {
      try {
        const existing = await voiceApi.joinChannel(channelId, myState);
        if (active) setParticipants(existing);
      } catch (e: any) {
        if (active) setErrorMsg(e.message || "Không thể tham gia kênh thoại.");
      }
    };

    // Setup websocket
    const setupWs = async () => {
      if (!globalWsClient.connected) {
        try {
          await globalWsClient.connect({ useSockJS: false });
        } catch {
          try {
            await globalWsClient.connect({ useSockJS: true });
          } catch {
            return;
          }
        }
      }

      subRef.current = globalWsClient.subscribe(
        `/topic/voice/${channelId}`,
        (frame) => {
          try {
            const msg = JSON.parse(frame.body);
            if (msg.type === "USER_JOINED") {
              setParticipants((prev) => {
                if (prev.find((p) => p.userId === msg.payload.userId))
                  return prev;
                return [...prev, msg.payload as VoiceParticipantDTO];
              });
            } else if (msg.type === "USER_LEFT") {
              const leftUserId = msg.senderId;
              setParticipants((prev) =>
                prev.filter((p) => p.userId !== leftUserId),
              );
              // Clean up PeerJS call and remote stream for the user who left
              if (callsRef.current[leftUserId]) {
                try {
                  callsRef.current[leftUserId].close();
                } catch {}
                delete callsRef.current[leftUserId];
              }
              setRemoteStreams((prev) => {
                const ns = { ...prev };
                delete ns[leftUserId];
                return ns;
              });
            } else if (msg.type === "STATE_UPDATE") {
              setParticipants((prev) =>
                prev.map((p) => {
                  if (p.userId === msg.senderId) {
                    return { ...p, ...msg.payload };
                  }
                  return p;
                }),
              );
            }
          } catch {}
        },
      );
    };

    let localStreamRef: MediaStream | null = null;
    let localPeerRef: any = null;

    const setupRTC = async () => {
      try {
        console.log("[WebRTC] Initializing audio stream...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // --- HACK: Pre-allocate a dummy video track to avoid WebRTC renegotiation ---
        // Create a 1x1 black canvas to generate a dummy video track
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, 1, 1);
        }
        // 1 fps is enough for a dummy track
        const dummyStream = canvas.captureStream(1);
        const dummyVideoTrack = dummyStream.getVideoTracks()[0];
        dummyVideoTrack.enabled = false; // Disable it to save bandwidth
        stream.addTrack(dummyVideoTrack);
        // -------------------------------------------------------------------------

        localStreamRef = stream;
        myStreamRef.current = stream;
        setMyState((prev) => ({ ...prev, micOn: true, camOn: false }));
        if (active && myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }

        // Dynamic import to prevent Vite from crashing due to global polyfill errors
        const PeerModule = await import("peerjs");
        const PeerClass = PeerModule.default || PeerModule.Peer || PeerModule;

        if (!active) return; // double check before creating peer

        const peer = new PeerClass(`${currentUserId}_${channelId}`, {
          debug: 1,
        });
        localPeerRef = peer;
        peerRef.current = peer;

        peer.on("open", async (id: string) => {
          if (!active) return;
          console.log("[PeerJS] My peer ID is:", id);

          // CRITICAL: Strict sequential order:
          // 1. Subscribe to STOMP first so we never miss any real-time events
          await setupWs();
          // 2. Then join the channel — backend broadcasts USER_JOINED to others
          await join();
          // 3. Mark peer as ready — now the second useEffect can start calling
          peerReadyRef.current = true;
          // 4. Force the calling useEffect to re-run by bumping participants
          setParticipants((prev) => [...prev]);
        });

        peer.on("call", (call: any) => {
          const callerUserId = call.peer.split("_")[0];
          console.log("[PeerJS] Receiving incoming call from:", callerUserId);

          // If we already have an outgoing call to this user, close the old one
          // to prevent duplicate connections
          if (callsRef.current[callerUserId]) {
            console.log(
              "[PeerJS] Already have a call with",
              callerUserId,
              "- replacing with incoming",
            );
            try {
              callsRef.current[callerUserId].close();
            } catch {}
          }

          // Register the incoming call
          callsRef.current[callerUserId] = call;

          if (myStreamRef.current) call.answer(myStreamRef.current);

          call.on("stream", (remoteStream: MediaStream) => {
            console.log(
              "[PeerJS] Received remote stream from:",
              callerUserId,
              "Audio:",
              remoteStream.getAudioTracks().length,
              "Video:",
              remoteStream.getVideoTracks().length,
            );
            setRemoteStreams((prev) => ({
              ...prev,
              [callerUserId]: remoteStream,
            }));
          });

          call.on("close", () => {
            console.log("[PeerJS] Incoming call closed with:", callerUserId);
            delete callsRef.current[callerUserId];
            setRemoteStreams((prev) => {
              const ns = { ...prev };
              delete ns[callerUserId];
              return ns;
            });
          });
        });

        peer.on("error", (err: any) => {
          console.error("[PeerJS] Peer error:", err);
        });
      } catch (err: any) {
        console.error("[WebRTC] Error getting user media:", err);
        if (active) setErrorMsg("Lỗi lấy luồng media: " + err.message);
      }
    };

    setupRTC();

    return () => {
      active = false;
      peerReadyRef.current = false;
      if (subRef.current) subRef.current.unsubscribe();
      if (localStreamRef) localStreamRef.getTracks().forEach((t) => t.stop());
      // Close all active calls
      Object.values(callsRef.current).forEach((call) => {
        try {
          call.close();
        } catch {}
      });
      callsRef.current = {};
      if (localPeerRef) {
        console.log("[PeerJS] Destroying peer on cleanup");
        localPeerRef.destroy();
      }
      // Leave channel api
      voiceApi.leaveChannel(channelId).catch(() => {});
    };
  }, [channelId, currentUserId]);

  // Effect: Initiate PeerJS calls to other participants using deterministic tie-breaker.
  // Only fires when peerReadyRef is true (after PeerJS + WS + join are all complete).
  useEffect(() => {
    if (!peerReadyRef.current || !peerRef.current || !myStreamRef.current)
      return;
    const peer = peerRef.current;
    const stream = myStreamRef.current;

    participants.forEach((p) => {
      if (p.userId === currentUserId) return;

      // Deterministic tie-breaker to prevent WebRTC glare:
      // Only the user with the strictly larger ID string initiates the call.
      // The other user will wait to receive the incoming call.
      if (currentUserId < p.userId) return;

      // Already have a call (outgoing or incoming) — skip
      if (callsRef.current[p.userId]) return;

      const targetPeerId = `${p.userId}_${channelId}`;
      // Use retry logic — the remote peer may not be registered on PeerServer yet
      callPeerWithRetry(peer, p.userId, targetPeerId, stream);
    });
  }, [participants, currentUserId, channelId]);

  // Handle toggles
  const toggleMic = () => {
    setMyState((prev) => {
      const nextMicState = !prev.micOn;
      if (myStreamRef.current) {
        myStreamRef.current
          .getAudioTracks()
          .forEach((t) => (t.enabled = nextMicState));
      }
      const nextState = { ...prev, micOn: nextMicState };
      sendStatusUpdate(nextState);
      return nextState;
    });
  };

  const toggleCam = async () => {
    const isCamOn = myState.camOn;
    if (!isCamOn) {
      try {
        console.log("[WebRTC] Requesting Camera stream...");
        const vidStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const videoTrack = vidStream.getVideoTracks()[0];
        console.log("[WebRTC] Camera track acquired:", videoTrack.label);

        if (myStreamRef.current) {
          // Remove ALL existing video tracks (especially the dummy one) BEFORE adding the real camera!
          // This ensures the local video element plays the correct real camera feed.
          myStreamRef.current.getVideoTracks().forEach((track) => {
            myStreamRef.current?.removeTrack(track);
            track.stop();
          });

          myStreamRef.current.addTrack(videoTrack);
          Object.values(callsRef.current).forEach((call) => {
            if (call.peerConnection) {
              const senders = call.peerConnection.getSenders();
              const existingVidSender = senders.find(
                (s: any) => s.track && s.track.kind === "video",
              );
              if (existingVidSender) {
                console.log(
                  "[WebRTC] Replacing video track for call to",
                  call.peer,
                );
                existingVidSender
                  .replaceTrack(videoTrack)
                  .catch((e: any) => console.error("Replace track failed:", e));
              } else {
                console.log(
                  "[WebRTC] Adding new video track to call to",
                  call.peer,
                );
                call.peerConnection.addTrack(videoTrack, myStreamRef.current!);
              }
            }
          });
        }
      } catch (err: any) {
        console.error("[WebRTC] No cam: " + err.message);
        return;
      }
      setMyState((prev) => {
        const nextState = { ...prev, camOn: true, screenShareOn: false };
        sendStatusUpdate(nextState);
        return nextState;
      });
    } else {
      if (myStreamRef.current) {
        console.log("[WebRTC] Stopping Camera track...");
        myStreamRef.current.getVideoTracks().forEach((track) => {
          // If it's a real track (not dummy), we stop it
          if (track.label !== "") {
            track.stop();
          }
          // HACK: Re-add dummy track to keep the sender active?
          // Actually, if we just replace it with dummy track again, it's safer.
          myStreamRef.current?.removeTrack(track);
        });

        // Re-create and add dummy track
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const dummyVideoTrack = canvas.captureStream(1).getVideoTracks()[0];
        dummyVideoTrack.enabled = false;
        myStreamRef.current.addTrack(dummyVideoTrack);

        Object.values(callsRef.current).forEach((call) => {
          if (call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            const existingVidSender = senders.find(
              (s: any) => s.track && s.track.kind === "video",
            );
            if (existingVidSender)
              existingVidSender.replaceTrack(dummyVideoTrack).catch(() => null);
          }
        });
      }
      setMyState((prev) => {
        const nextState = { ...prev, camOn: false, screenShareOn: false };
        sendStatusUpdate(nextState);
        return nextState;
      });
    }
  };

  const toggleScreen = async () => {
    const isScreenOn = myState.screenShareOn;
    if (!isScreenOn) {
      try {
        console.log("[WebRTC] Requesting Screen share stream...");
        const scrStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = scrStream.getVideoTracks()[0];
        console.log("[WebRTC] Screen track acquired:", screenTrack.label);

        if (myStreamRef.current) {
          // Remove ALL existing video tracks (including dummy or cam) BEFORE adding screen track
          myStreamRef.current.getVideoTracks().forEach((track) => {
            track.stop();
            myStreamRef.current?.removeTrack(track);
          });

          myStreamRef.current.addTrack(screenTrack);

          Object.values(callsRef.current).forEach((call) => {
            if (call.peerConnection) {
              const senders = call.peerConnection.getSenders();
              const existingVidSender = senders.find(
                (s: any) => s.track && s.track.kind === "video",
              );
              if (existingVidSender) {
                console.log(
                  "[WebRTC] Replacing screen track for call to",
                  call.peer,
                );
                existingVidSender
                  .replaceTrack(screenTrack)
                  .catch((e: any) =>
                    console.error("Replace screen track failed:", e),
                  );
              } else {
                console.log(
                  "[WebRTC] Adding new screen track to call to",
                  call.peer,
                );
                call.peerConnection.addTrack(screenTrack, myStreamRef.current!);
              }
            }
          });

          screenTrack.onended = () => {
            console.log("[WebRTC] Screen sharing ended by user");
            if (myStreamRef.current) {
              myStreamRef.current.removeTrack(screenTrack);

              // Re-add dummy track
              const canvas = document.createElement("canvas");
              canvas.width = 1;
              canvas.height = 1;
              const dummyVideoTrack = canvas
                .captureStream(1)
                .getVideoTracks()[0];
              dummyVideoTrack.enabled = false;
              myStreamRef.current.addTrack(dummyVideoTrack);

              Object.values(callsRef.current).forEach((call) => {
                if (call.peerConnection) {
                  const senders = call.peerConnection.getSenders();
                  const existingVidSender = senders.find(
                    (s: any) => s.track && s.track.kind === "video",
                  );
                  if (existingVidSender)
                    existingVidSender
                      .replaceTrack(dummyVideoTrack)
                      .catch(() => null);
                }
              });
            }
            setMyState((prev) => {
              const ns = { ...prev, screenShareOn: false };
              sendStatusUpdate(ns);
              return ns;
            });
          };
        }
      } catch (err: any) {
        console.error("[WebRTC] Screen share error: " + err.message);
        return;
      }

      setMyState((prev) => {
        const nextState = { ...prev, screenShareOn: true, camOn: false };
        sendStatusUpdate(nextState);
        return nextState;
      });
    } else {
      if (myStreamRef.current) {
        console.log("[WebRTC] Stopping Screen share track...");
        myStreamRef.current.getVideoTracks().forEach((track) => {
          track.stop();
          myStreamRef.current?.removeTrack(track);
        });

        // Re-create and add dummy track
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const dummyVideoTrack = canvas.captureStream(1).getVideoTracks()[0];
        dummyVideoTrack.enabled = false;
        myStreamRef.current.addTrack(dummyVideoTrack);

        Object.values(callsRef.current).forEach((call) => {
          if (call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            const existingVidSender = senders.find(
              (s: any) => s.track && s.track.kind === "video",
            );
            if (existingVidSender)
              existingVidSender.replaceTrack(dummyVideoTrack).catch(() => null);
          }
        });
      }

      setMyState((prev) => {
        const nextState = { ...prev, screenShareOn: false, camOn: false };
        sendStatusUpdate(nextState);
        return nextState;
      });
    }
  };

  const sendStatusUpdate = (state: any) => {
    if (globalWsClient.connected) {
      globalWsClient.publish(`/app/voice.signal`, {
        type: "STATE_UPDATE",
        channelId: channelId,
        payload: state,
      });
      // Do backend trả về cho mọi người kể cả sender nên UI state tự sync
    }
  };

  if (errorMsg) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#313338",
          color: "#DBDEE1",
        }}
      >
        <p style={{ color: "#F23F42", fontSize: "16px", marginBottom: "16px" }}>
          {errorMsg}
        </p>
        <button
          onClick={onLeave}
          style={{
            padding: "8px 16px",
            backgroundColor: "#5865F2",
            color: "white",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Trở về
        </button>
      </div>
    );
  }

  // Calculate Layout (Grid)
  const count = participants.length;
  let cols = 1;
  let rows = 1;

  if (count === 1) {
    cols = 1;
    rows = 1;
  } else if (count === 2) {
    cols = 2;
    rows = 1;
  } else if (count === 3 || count === 4) {
    cols = 2;
    rows = 2;
  } else if (count === 5 || count === 6) {
    cols = 3;
    rows = 2;
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#000",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Grid view */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: count === 2 ? "auto" : `repeat(${rows}, 1fr)`,
          alignContent: "center",
          gap: "8px",
          padding: "8px",
          height: "calc(100% - 80px)", // Trừ đi phần control bar
          boxSizing: "border-box",
        }}
      >
        {participants.map((p) => (
          <div
            key={p.userId}
            style={{
              backgroundColor: "#2B2D31",
              borderRadius: "8px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              aspectRatio: count === 2 ? "16/9" : "auto",
            }}
          >
            {/* Video & Avatar container */}
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#1e1f22",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {p.camOn || p.screenShareOn ? (
                <video
                  id={`video-${p.userId}`}
                  autoPlay
                  playsInline
                  muted={p.userId === currentUserId}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: p.screenShareOn ? "contain" : "cover",
                  }}
                  ref={(el) => {
                    if (el) {
                      if (p.userId === currentUserId) {
                        if (myVideoRef.current !== el) {
                          myVideoRef.current = el;
                          el.srcObject = myStreamRef.current;
                          console.log("[Video Element] Attaching LOCAL stream");
                        }
                      } else {
                        const stream = remoteStreams[p.userId] || null;
                        if (el.srcObject !== stream) {
                          el.srcObject = stream;
                          console.log(
                            "[Video Element] Attaching REMOTE stream for",
                            p.userId,
                          );
                        }
                      }
                    }
                  }}
                />
              ) : (
                // Chỉ hiển thị ảnh Avatar
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: "#1e1f22",
                    overflow: "hidden",
                  }}
                >
                  {p.hasAvatar ? (
                    <img
                      src={userApi.getAvatarUrl(p.userId, avatarTs)}
                      alt={p.username}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                      }}
                    >
                      👤
                    </div>
                  )}
                </div>
              )}

              {/* Chơi âm thanh ẩn ở background nếu đã tắt cam nhưng bật mic */}
              {p.userId !== currentUserId && remoteStreams[p.userId] && (
                <audio
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el) {
                      const stream = remoteStreams[p.userId] || null;
                      if (el.srcObject !== stream) {
                        el.srcObject = stream;
                        console.log(
                          "[Audio Element] Attaching REMOTE audio for",
                          p.userId,
                        );
                      }
                    }
                  }}
                  style={{ display: "none" }}
                />
              )}
            </div>

            {/* Username Tag */}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "4px 8px",
                borderRadius: "4px",
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {p.username}
            </div>

            {/* Mic Status */}
            {!p.micOn && (
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  backgroundColor: "#F23F42",
                  padding: "6px",
                  borderRadius: "50%",
                  color: "white",
                  display: "flex",
                }}
              >
                <MicOff size={16} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div
        style={{
          height: "80px",
          backgroundColor: "#1E1F22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={toggleMic}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: myState.micOn ? "#313338" : "#F23F42",
            color: "white",
          }}
        >
          {myState.micOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={toggleCam}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: myState.camOn ? "#313338" : "#F23F42",
            color: "white",
          }}
        >
          {myState.camOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          onClick={toggleScreen}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: myState.screenShareOn ? "#22c55e" : "#313338",
            color: "white",
          }}
        >
          <MonitorUp size={24} />
        </button>

        <button
          onClick={onLeave}
          style={{
            width: "64px",
            height: "48px",
            borderRadius: "24px",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: "#F23F42",
            color: "white",
            marginLeft: "16px",
          }}
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
