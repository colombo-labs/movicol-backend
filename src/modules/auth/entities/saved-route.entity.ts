import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('saved_routes')
export class SavedRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  originLabel: string;

  @Column('decimal', { precision: 10, scale: 7 })
  originLat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  originLng: number;

  @Column()
  destLabel: string;

  @Column('decimal', { precision: 10, scale: 7 })
  destLat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  destLng: number;

  @Column({ nullable: true })
  estimatedMinutes: number;

  @Column({ nullable: true })
  mode: string; // publico | vehiculo

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
