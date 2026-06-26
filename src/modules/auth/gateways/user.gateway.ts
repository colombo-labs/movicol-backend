import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseGateway } from '../../../common/gateways/base.gateway';
import { WsEvent } from '../../../common/interfaces/ws-events.interface';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ws' })
export class UserGateway extends BaseGateway {
  @SubscribeMessage('user:join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    this.joinRoom(client, `user:${data.userId}`);
  }

  /** Notify a user that their profile/role changed — they should refetch /me */
  notifyUserUpdated(userId: number): void {
    this.emitToRoom(`user:${userId}`, WsEvent.USER_UPDATED, { userId });
  }

  /** Force logout a user (e.g., role removed, account disabled) */
  notifyForceLogout(userId: number, reason: string): void {
    this.emitToRoom(`user:${userId}`, WsEvent.USER_FORCE_LOGOUT, { userId, reason });
  }
}
