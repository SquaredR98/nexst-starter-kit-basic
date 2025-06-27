import { Injectable, Inject } from '@nestjs/common';
import { TenantRepository } from '../../database/entities/tenant/repository';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    @Inject('TenantRepository')
    private readonly tenantRepository: TenantRepository,
  ) {}

  create(createTenantDto: CreateTenantDto) {
    return this.tenantRepository.save(createTenantDto);
  }

  findAll() {
    return this.tenantRepository.find();
  }

  findOne(id: number) {
    return this.tenantRepository.findOne({ where: { id } });
  }

  update(id: number, updateTenantDto: UpdateTenantDto) {
    return this.tenantRepository.update(id, updateTenantDto);
  }

  remove(id: number) {
    return this.tenantRepository.delete(id);
  }
} 