import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { State } from '../../database/entities/state/entity';
import { StateRepository } from '../../database/entities/state/repository';
import { StateService } from './state.service';
import { StateController } from './state.controller';

@Module({
  imports: [TypeOrmModule.forFeature([State])],
  controllers: [StateController],
  providers: [
    StateService,
    {
      provide: 'StateRepository',
      useClass: StateRepository,
    },
  ],
  exports: [StateService, 'StateRepository'],
})
export class StateModule {} 