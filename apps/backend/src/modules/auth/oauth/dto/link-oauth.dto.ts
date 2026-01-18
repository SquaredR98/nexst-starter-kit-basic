import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UnlinkOAuthDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'github'], { message: 'Provider must be google or github' })
  provider: string;
}
