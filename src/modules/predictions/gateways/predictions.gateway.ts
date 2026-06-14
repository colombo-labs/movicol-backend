import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { BaseGateway } from '../../../common/gateways/base.gateway';
import { WsEvent } from '../../../common/interfaces/ws-events.interface';
import { PredictionsService } from '../services/predictions.service';

interface SubscribePayload {
  stationIds?: string[];
  zone?: string;
}

/**
 * Predictions WebSocket gateway.
 * Clients subscribe to stations/zones and receive live prediction updates.
 * Reuses PredictionsService — zero logic duplication with the REST controller.
 */
@WebSocketGateway({ namespace: 'predictions', cors: { origin: '*' } })
export class PredictionsGateway extends BaseGateway {
  constructor(private readonly predictionsService: PredictionsService) {
    super();
  }

  @SubscribeMessage(WsEvent.PREDICTIONS_SUBSCRIBE)
  handleSubscribe(@MessageBody() payload: SubscribePayload, @ConnectedSocket() client: Socket) {
    // Join rooms for each station or zone
    if (payload.stationIds) {
      payload.stationIds.forEach((id) => this.joinRoom(client, `station:${id}`));
    }
    if (payload.zone) {
      this.joinRoom(client, `zone:${payload.zone}`);
    }

    this.emitToClient(client, WsEvent.PREDICTIONS_SUBSCRIBE, {
      subscribed: true,
      rooms: payload.stationIds?.map((id) => `station:${id}`) ?? [],
    });
  }

  @SubscribeMessage(WsEvent.PREDICTIONS_UNSUBSCRIBE)
  handleUnsubscribe(@MessageBody() payload: SubscribePayload, @ConnectedSocket() client: Socket) {
    if (payload.stationIds) {
      payload.stationIds.forEach((id) => this.leaveRoom(client, `station:${id}`));
    }
    if (payload.zone) {
      this.leaveRoom(client, `zone:${payload.zone}`);
    }
  }

  /**
   * Called by the service/scheduler to broadcast new predictions.
   * NOT triggered by client — triggered server-side.
   */
  broadcastPrediction(stationId: string, prediction: unknown) {
    this.emitToRoom(`station:${stationId}`, WsEvent.PREDICTIONS_UPDATE, prediction);
  }
}
