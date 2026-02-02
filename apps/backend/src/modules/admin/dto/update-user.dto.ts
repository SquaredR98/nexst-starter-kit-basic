import { IsOptional, IsBoolean, IsArray, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

export class BanUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
