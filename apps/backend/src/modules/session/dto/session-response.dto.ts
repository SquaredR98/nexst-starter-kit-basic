export class SessionResponseDto {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export class SessionListResponseDto {
  sessions: SessionResponseDto[];
  total: number;
}
