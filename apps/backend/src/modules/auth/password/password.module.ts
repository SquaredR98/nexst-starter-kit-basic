import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../database/entities/user.entity';
import { Profile } from '../../../database/entities/profile.entity';
import { Session } from '../../../database/entities/session.entity';
import { PasswordHistory } from '../../../database/entities/password-history.entity';
import { UserRole } from '../../../database/entities/user-role.entity';
import { Role } from '../../../database/entities/role.entity';
import { JwtAuthModule } from '../jwt/jwt.module';
import { PasswordService } from './password.service';
import { PasswordController } from './password.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      Session,
      PasswordHistory,
      UserRole,
      Role,
    ]),
    JwtAuthModule,
  ],
  providers: [PasswordService],
  controllers: [PasswordController],
  exports: [PasswordService],
})
export class PasswordModule {}
