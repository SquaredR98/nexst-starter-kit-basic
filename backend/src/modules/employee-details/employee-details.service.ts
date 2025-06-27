import { Injectable, Inject } from '@nestjs/common';
import { EmployeeDetailsRepository } from '../../database/entities/employee-details/repository';
import { CreateEmployeeDetailsDto } from './dto/create-employee-details.dto';
import { UpdateEmployeeDetailsDto } from './dto/update-employee-details.dto';

@Injectable()
export class EmployeeDetailsService {
  constructor(
    @Inject('EmployeeDetailsRepository')
    private readonly employeeDetailsRepository: EmployeeDetailsRepository,
  ) {}

  create(createEmployeeDetailsDto: CreateEmployeeDetailsDto) {
    return this.employeeDetailsRepository.save(createEmployeeDetailsDto);
  }

  findAll() {
    return this.employeeDetailsRepository.find();
  }

  findOne(id: number) {
    return this.employeeDetailsRepository.findOne({ where: { id } });
  }

  update(id: number, updateEmployeeDetailsDto: UpdateEmployeeDetailsDto) {
    return this.employeeDetailsRepository.update(id, updateEmployeeDetailsDto);
  }

  remove(id: number) {
    return this.employeeDetailsRepository.delete(id);
  }
} 