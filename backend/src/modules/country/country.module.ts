import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from '../../database/entities/country/entity';
import { CountryRepository } from '../../database/entities/country/repository';
import { CountryService } from './country.service';
import { CountryController } from './country.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  controllers: [CountryController],
  providers: [
    CountryService,
    {
      provide: 'CountryRepository',
      useClass: CountryRepository,
    },
  ],
  exports: [CountryService, 'CountryRepository'],
})
export class CountryModule {} 