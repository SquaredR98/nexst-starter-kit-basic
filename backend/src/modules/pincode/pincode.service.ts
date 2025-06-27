import { Injectable, Inject } from '@nestjs/common';
import { PincodeRepository } from '../../database/entities/pincode/repository';
import { CreatePincodeDto } from './dto/create-pincode.dto';
import { UpdatePincodeDto } from './dto/update-pincode.dto';

@Injectable()
export class PincodeService {
  constructor(
    @Inject('PincodeRepository')
    private readonly pincodeRepository: PincodeRepository,
  ) {}

  create(createPincodeDto: CreatePincodeDto) {
    return this.pincodeRepository.save(createPincodeDto);
  }

  findAll() {
    return this.pincodeRepository.find();
  }

  findOne(id: number) {
    return this.pincodeRepository.findOne({ where: { id } });
  }

  update(id: number, updatePincodeDto: UpdatePincodeDto) {
    return this.pincodeRepository.update(id, updatePincodeDto);
  }

  remove(id: number) {
    return this.pincodeRepository.delete(id);
  }
} 