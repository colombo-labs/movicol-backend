import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  module: string;

  @Column()
  action: string;

  @Column({ unique: true })
  key: string; // module.action

  @Column({ nullable: true })
  description: string;
}
