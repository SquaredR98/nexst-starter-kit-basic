import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { EmployeeDetailsService } from './employee-details.service';
import { CreateEmployeeDetailsDto } from './dto/create-employee-details.dto';
import { UpdateEmployeeDetailsDto } from './dto/update-employee-details.dto';

@Controller('employee-details')
export class EmployeeDetailsController {
  constructor(private readonly employeeDetailsService: EmployeeDetailsService) {}

  @Post()
  create(@Body() createEmployeeDetailsDto: CreateEmployeeDetailsDto) {
    return this.employeeDetailsService.create(createEmployeeDetailsDto);
  }

  @Get()
  findAll() {
    return this.employeeDetailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeDetailsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDetailsDto: UpdateEmployeeDetailsDto) {
    return this.employeeDetailsService.update(+id, updateEmployeeDetailsDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeDetailsService.remove(+id);
  }
} 