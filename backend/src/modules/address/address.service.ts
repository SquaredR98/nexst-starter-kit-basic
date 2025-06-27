import { Injectable, Inject } from '@nestjs/common';
import { AddressRepository } from '../../database/entities/address/repository';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @Inject('AddressRepository')
    private readonly addressRepository: AddressRepository,
  ) {}

  create(createAddressDto: CreateAddressDto) {
    return this.addressRepository.save(createAddressDto);
  }

  findAll() {
    return this.addressRepository.find();
  }

  findOne(id: number) {
    return this.addressRepository.findOne({ where: { id } });
  }

  update(id: number, updateAddressDto: UpdateAddressDto) {
    return this.addressRepository.update(id, updateAddressDto);
  }

  remove(id: number) {
    return this.addressRepository.delete(id);
  }
} 