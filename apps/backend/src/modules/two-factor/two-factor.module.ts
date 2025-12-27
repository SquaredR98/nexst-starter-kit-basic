import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { User } from '../../database/entities/user.entity';
import { TwoFactor } from '../../database/entities/two-factor.entity';
import { JwtAuthModule } from '../auth/jwt/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TwoFactor]),
    JwtAuthModule,
  ],
  controllers: [TwoFactorController],
  providers: [TwoFactorService],
  exports: [TwoFactorService],
})
export class TwoFactorModule {}
