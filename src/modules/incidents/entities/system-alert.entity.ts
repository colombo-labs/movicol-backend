import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('system_alerts')
export class SystemAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ length: 50 })
  type: string; // suspended | delayed | modified | info

  @Column('text', { array: true, default: '{}' })
  routeCodes: string[];

  @Column({ length: 20, default: 'scraping' })
  source: string;

  @Column({ type: 'text', default: '' })
  url: string;

  @CreateDateColumn()
  createdAt: Date;
}
