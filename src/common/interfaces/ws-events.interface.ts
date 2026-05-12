/**
 * Typed WebSocket events — single source of truth.
 * Shared between gateways and frontend client.
 */
export enum WsEvent {
  // Connection
  CONNECT = 'connection',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',

  // Predictions
  PREDICTIONS_SUBSCRIBE = 'predictions:subscribe',
  PREDICTIONS_UNSUBSCRIBE = 'predictions:unsubscribe',
  PREDICTIONS_UPDATE = 'predictions:update',

  // Chat (streaming)
  CHAT_MESSAGE = 'chat:message',
  CHAT_STREAM_START = 'chat:stream:start',
  CHAT_STREAM_TOKEN = 'chat:stream:token',
  CHAT_STREAM_END = 'chat:stream:end',

  // Alerts
  ALERT_CONGESTION = 'alert:congestion',
  ALERT_INCIDENT = 'alert:incident',
}

export interface WsResponse<T = unknown> {
  event: WsEvent;
  data: T;
  timestamp: string;
}
