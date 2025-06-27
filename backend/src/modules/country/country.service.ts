import { Injectable, Inject } from '@nestjs/common';
import { CountryRepository } from '../../database/entities/country/repository';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountryService {
  constructor(
    @Inject('CountryRepository')
    private readonly countryRepository: CountryRepository,
  ) {}

  create(createCountryDto: CreateCountryDto) {
    return this.countryRepository.save(createCountryDto);
  }

  findAll() {
    return this.countryRepository.find();
  }

  findOne(id: number) {
    return this.countryRepository.findOne({ where: { id } });
  }

  update(id: number, updateCountryDto: UpdateCountryDto) {
    return this.countryRepository.update(id, updateCountryDto);
  }

  remove(id: number) {
    return this.countryRepository.delete(id);
  }
} 