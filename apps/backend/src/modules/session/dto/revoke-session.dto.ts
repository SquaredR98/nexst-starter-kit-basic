import { IsUUID, IsNotEmpty } from 'class-validator';

export class RevokeSessionDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;
}
