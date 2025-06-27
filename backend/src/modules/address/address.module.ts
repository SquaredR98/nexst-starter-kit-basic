import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '../../database/entities/address/entity';
import { AddressRepository } from '../../database/entities/address/repository';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Address])],
  controllers: [AddressController],
  providers: [
    AddressService,
    {
      provide: 'AddressRepository',
      useClass: AddressRepository,
    },
  ],
  exports: [AddressService, 'AddressRepository'],
})
export class AddressModule {} 