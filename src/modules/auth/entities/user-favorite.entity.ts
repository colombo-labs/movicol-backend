import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_favorites')
export class UserFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string; // route | station | zone

  @Column('jsonb')
  data: Record<string, any>;

  @Column({ nullable: true })
  label: string;

  @ManyToOne(() => User, (user) => user.favorites)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
