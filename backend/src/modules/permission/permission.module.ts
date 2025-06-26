import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../database/entities/permission/entity';
import { PermissionRepository } from '../../database/entities/permission/repository';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    {
      provide: 'PermissionRepository',
      useClass: PermissionRepository,
    },
  ],
  exports: [PermissionService, 'PermissionRepository'],
})
export class PermissionModule {} 