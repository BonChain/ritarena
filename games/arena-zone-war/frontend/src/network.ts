import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

console.log(`[NETWORK] Initializing socket to ${SERVER_URL}`);

const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
});

let latestState: any = null;

socket.on("state", (payload) => {
  latestState = payload.state;
});

socket.on("connect", () => {
  console.log(`[NETWORK] Socket connected: ${socket.id}`);
});

socket.on("connect_error", (err) => {
  console.error(`[NETWORK] Socket connection error: ${err?.message || 'unknown'} to ${SERVER_URL}`);
});

export function getState() {
  return latestState;
}
