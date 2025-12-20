// src/utils/webrtcConfig.js
export const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // free STUN
  ],
};

export function createPeerConnection() {
  return new RTCPeerConnection(iceServers);
}
