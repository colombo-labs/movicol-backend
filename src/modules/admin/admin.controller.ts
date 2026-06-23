import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== USERS ====================

  @Get('users')
  @RequirePermissions('admin.users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Patch('users/:id/role')
  @RequirePermissions('admin.users')
  updateUserRole(@Param('id') id: string, @Body('roleId') roleId: number) {
    return this.adminService.updateUserRole(id, roleId);
  }

  @Patch('users/:id/status')
  @RequirePermissions('admin.users')
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Get('users/:id/permissions')
  @RequirePermissions('admin.users')
  getUserPermissions(@Param('id') id: string) {
    return this.adminService.getUserEffectivePermissions(id);
  }

  @Put('users/:id/permissions')
  @RequirePermissions('admin.users')
  setUserExtraPermissions(
    @Param('id') id: string,
    @Body('permissionIds') permissionIds: number[],
  ) {
    return this.adminService.setUserExtraPermissions(id, permissionIds);
  }

  // ==================== ROLES ====================

  @Get('roles')
  @RequirePermissions('admin.roles')
  findAllRoles() {
    return this.adminService.findAllRoles();
  }

  @Post('roles')
  @RequirePermissions('admin.roles')
  createRole(@Body() body: { name: string; description?: string }) {
    return this.adminService.createRole(body.name, body.description);
  }

  @Put('roles/:id')
  @RequirePermissions('admin.roles')
  updateRole(
    @Param('id') id: number,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.adminService.updateRole(id, body);
  }

  @Delete('roles/:id')
  @RequirePermissions('admin.roles')
  deleteRole(@Param('id') id: number) {
    return this.adminService.deleteRole(id);
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('admin.roles')
  setRolePermissions(
    @Param('id') id: number,
    @Body('permissionIds') permissionIds: number[],
  ) {
    return this.adminService.setRolePermissions(id, permissionIds);
  }

  // ==================== PERMISSIONS ====================

  @Get('permissions')
  @RequirePermissions('admin.permissions')
  findAllPermissions() {
    return this.adminService.findAllPermissions();
  }

  @Post('permissions')
  @RequirePermissions('admin.permissions')
  createPermission(@Body() body: { module: string; action: string; description?: string }) {
    return this.adminService.createPermission(body);
  }

  @Delete('permissions/:id')
  @RequirePermissions('admin.permissions')
  deletePermission(@Param('id') id: number) {
    return this.adminService.deletePermission(id);
  }
}
