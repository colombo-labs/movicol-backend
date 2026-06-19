import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { WsEvent, WsResponse } from '../interfaces/ws-events.interface';

/**
 * Abstract base gateway — handles connection lifecycle, heartbeat, rooms, and error handling.
 * All feature gateways extend this to avoid duplicating boilerplate.
 */
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export abstract class BaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  protected server: Server;

  protected readonly logger = new Logger(this.constructor.name);

  afterInit() {
    this.logger.log(`${this.constructor.name} initialized`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(WsEvent.HEARTBEAT)
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    client.emit(WsEvent.HEARTBEAT, { timestamp: new Date().toISOString() });
  }

  /**
   * Join a room (e.g., station ID, zone).
   * Client sends: { room: 'station:abc123' }
   */
  protected joinRoom(client: Socket, room: string): void {
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room: ${room}`);
  }

  /**
   * Leave a room.
   */
  protected leaveRoom(client: Socket, room: string): void {
    client.leave(room);
    this.logger.debug(`Client ${client.id} left room: ${room}`);
  }

  /**
   * Emit to all clients in a room.
   */
  protected emitToRoom<T>(room: string, event: WsEvent, data: T): void {
    const response: WsResponse<T> = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    this.server.to(room).emit(event, response);
  }

  /**
   * Emit to a single client with typed response.
   */
  protected emitToClient<T>(client: Socket, event: WsEvent, data: T): void {
    const response: WsResponse<T> = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    client.emit(event, response);
  }
}
