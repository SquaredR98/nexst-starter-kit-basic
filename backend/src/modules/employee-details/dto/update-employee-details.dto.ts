export class UpdateEmployeeDetailsDto {
  profile_id?: number;
  salary_structure?: Record<string, any>;
  department?: string;
  designation?: string;
  joining_date?: Date;
} 