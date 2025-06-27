import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from '../../database/entities/city/entity';
import { CityRepository } from '../../database/entities/city/repository';
import { CityController } from './city.controller';
import { CityService } from './city.service';

@Module({
  imports: [TypeOrmModule.forFeature([City])],
  controllers: [CityController],
  providers: [
    CityService,
    {
      provide: 'CityRepository',
      useClass: CityRepository,
    },
  ],
  exports: [CityService, 'CityRepository'],
})
export class CityModule {} 