import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp',
      entities: [join(__dirname, '/entities/**/*.entity.{ts,js}')],
      synchronize: true, // Set to false in production
    }),
    TypeOrmModule.forFeature([]), // Feature repositories can be registered in their own modules
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {} 