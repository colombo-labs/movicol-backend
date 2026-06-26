import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { RolePermission } from '../auth/entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    CommonModule,
    TypeOrmModule.forFeature([User, Role, Permission, RolePermission, UserPermission]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
