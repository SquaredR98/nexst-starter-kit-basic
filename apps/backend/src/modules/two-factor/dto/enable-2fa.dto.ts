import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Enable2faDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;
}

export class Verify2faDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;
}

export class UseBackupCodeDto {
  @IsString()
  @IsNotEmpty()
  backupCode: string;
}
