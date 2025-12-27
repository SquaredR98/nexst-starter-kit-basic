/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configurations from './config';
import { validate } from './config/validation/env.validation';
import KeyvRedis from '@keyv/redis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import Redis from 'ioredis';
import { JwtAuthModule } from './modules/auth/jwt/jwt.module';
import { PasswordModule } from './modules/auth/password/password.module';
import { SessionModule } from './modules/session/session.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { UserModule } from './modules/user/user.module';
import { TwoFactorModule } from './modules/two-factor/two-factor.module';

@Module({
  imports: [
    //Configuration AppModule
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      validate,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/database/entities/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    // Redis Cache Module (Using Keyv with ioredis client)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisClient = new Redis({
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          db: 0,
          keyPrefix: 'auth:',
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        return {
          store: new Keyv({
            store: new KeyvRedis(redisClient as any),
            ttl: configService.get('redis.ttl') * 1000,
          }),
        };
      },
      inject: [ConfigService],
    }),
    // Auth Modules
    JwtAuthModule,
    PasswordModule,
    SessionModule,
    RbacModule,
    UserModule,
    TwoFactorModule,
  ],
})
export class AppModule {}
