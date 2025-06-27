import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeDetails } from '../../database/entities/employee-details/entity';
import { EmployeeDetailsRepository } from '../../database/entities/employee-details/repository';
import { EmployeeDetailsService } from './employee-details.service';
import { EmployeeDetailsController } from './employee-details.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeDetails])],
  controllers: [EmployeeDetailsController],
  providers: [
    EmployeeDetailsService,
    {
      provide: 'EmployeeDetailsRepository',
      useClass: EmployeeDetailsRepository,
    },
  ],
  exports: [EmployeeDetailsService, 'EmployeeDetailsRepository'],
})
export class EmployeeDetailsModule {} 