import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserSortField {
  CREATED_AT = 'createdAt',
  EMAIL = 'email',
  LAST_LOGIN = 'lastLoginAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ListUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserSortField)
  sortBy?: UserSortField = UserSortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @Type(() => Boolean)
  emailVerified?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  isLocked?: boolean;
}
