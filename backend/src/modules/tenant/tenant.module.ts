import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../database/entities/tenant/entity';
import { TenantRepository } from '../../database/entities/tenant/repository';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [
    TenantService,
    {
      provide: 'TenantRepository',
      useClass: TenantRepository,
    },
  ],
  exports: [TenantService, 'TenantRepository'],
})
export class TenantModule {} 