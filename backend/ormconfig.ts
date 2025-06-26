import { DataSource } from 'typeorm';
import { join } from 'path';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp',
  entities: [join(__dirname, 'src/database/entities/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'src/database/migrations/*.{ts,js}')],
  synchronize: false,
  logging: true,
}); 