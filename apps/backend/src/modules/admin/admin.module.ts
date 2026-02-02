import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Session } from '../../database/entities/session.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { Role } from '../../database/entities/role.entity';
import { RbacModule } from '../rbac/rbac.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      Session,
      UserRole,
      Role,
    ]),
    RbacModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
