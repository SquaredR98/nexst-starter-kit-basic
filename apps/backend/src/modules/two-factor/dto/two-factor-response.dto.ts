export class Setup2faResponseDto {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export class BackupCodesResponseDto {
  backupCodes: string[];
}

export class Verify2faResponseDto {
  success: boolean;
  message: string;
}

export class TwoFactorStatusDto {
  enabled: boolean;
  backupCodesRemaining: number;
}
