import { Injectable, Inject } from '@nestjs/common';
import { StateRepository } from '../../database/entities/state/repository';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';

@Injectable()
export class StateService {
  constructor(
    @Inject('StateRepository')
    private readonly stateRepository: StateRepository,
  ) {}

  create(createStateDto: CreateStateDto) {
    return this.stateRepository.save(createStateDto);
  }

  findAll() {
    return this.stateRepository.find();
  }

  findOne(id: number) {
    return this.stateRepository.findOne({ where: { id } });
  }

  update(id: number, updateStateDto: UpdateStateDto) {
    return this.stateRepository.update(id, updateStateDto);
  }

  remove(id: number) {
    return this.stateRepository.delete(id);
  }
} 