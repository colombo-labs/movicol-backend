import {
  Column,
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryColumn()
  userId: string;

  @Column({ default: 'es' })
  language: string;

  @Column({ default: 'dark' })
  theme: string;

  @Column({ default: true })
  notificationsEnabled: boolean;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
