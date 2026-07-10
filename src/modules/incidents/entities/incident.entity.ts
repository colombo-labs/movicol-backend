import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  type: string; // demora | lleno | inseguro | cerrado | accidente | route_accurate | route_inaccurate

  @Column('double precision')
  lat: number;

  @Column('double precision')
  lng: number;

  @Column({ length: 20, default: '' })
  routeCode: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ length: 20, default: 'user_report' })
  source: string;

  @Column({ default: 1 })
  votes: number;

  @CreateDateColumn()
  createdAt: Date;
}
