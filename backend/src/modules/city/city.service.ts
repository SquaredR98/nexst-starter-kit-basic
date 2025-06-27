import { Injectable, Inject } from '@nestjs/common';
import { CityRepository } from '../../database/entities/city/repository';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CityService {
  constructor(
    @Inject('CityRepository')
    private readonly cityRepository: CityRepository,
  ) {}

  create(createCityDto: CreateCityDto) {
    return this.cityRepository.save(createCityDto);
  }

  findAll() {
    return this.cityRepository.find();
  }

  findOne(id: number) {
    return this.cityRepository.findOne({ where: { id } });
  }

  update(id: number, updateCityDto: UpdateCityDto) {
    return this.cityRepository.update(id, updateCityDto);
  }

  remove(id: number) {
    return this.cityRepository.delete(id);
  }
} 