import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Permission } from '../../auth/entities/permission.entity';

@Entity('user_permissions')
export class UserPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  permissionId: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Permission)
  permission: Permission;
}
