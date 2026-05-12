import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 7 })
  lat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  lon: number;

  @Column({ nullable: true })
  route: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ default: 0 })
  degree: number;
}
