import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  originStationId: string;

  @Column()
  destinationStationId: string;

  @Column({ nullable: true })
  type: string; // troncal | zonal | alimentador

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  distanceKm: number;
}
