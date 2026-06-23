import { Module } from '@nestjs/common';
import { UserGateway } from "./gateways/user.gateway";
import { UserPermission } from "../admin/entities/user-permission.entity";
import { SavedRoute } from "./entities/saved-route.entity";
import { SavedRoutesController } from "./saved-routes.controller";
import { PreferencesController } from "./preferences.controller";
import { NotificationsController } from "./notifications.controller";
import { Notification } from "./entities/notification.entity";
import { UserPreference } from "./entities/user-preference.entity";
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserFavorite } from './entities/user-favorite.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'movicol-jwt-secret-dev'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    TypeOrmModule.forFeature([User, Role, Permission, RolePermission, UserFavorite, RefreshToken, UserPermission, SavedRoute, UserPreference, Notification]),
  ],
  controllers: [AuthController, SavedRoutesController, PreferencesController, NotificationsController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, JwtAuthGuard, PermissionsGuard, UserGateway],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard, UserGateway],
})
export class AuthModule {}
