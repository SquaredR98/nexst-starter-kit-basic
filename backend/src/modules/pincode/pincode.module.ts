import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pincode } from '../../database/entities/pincode/entity';
import { PincodeRepository } from '../../database/entities/pincode/repository';
import { PincodeService } from './pincode.service';
import { PincodeController } from './pincode.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pincode])],
  controllers: [PincodeController],
  providers: [
    PincodeService,
    {
      provide: 'PincodeRepository',
      useClass: PincodeRepository,
    },
  ],
  exports: [PincodeService, 'PincodeRepository'],
})
export class PincodeModule {} 