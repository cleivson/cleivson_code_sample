import { ApiProperty } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';

/**
 * Represents an entry of the weekly jogging report.
 */
export class WeeklyReportDto {
  /**
   * The week represented by this report entry in ISO 8601 format (e.g.: 14-2019).
   */
  @IsDefined()
  @ApiProperty()
  week: string;

  /**
   * The average travelled distance in this week in meters.
   */
  @IsDefined()
  @ApiProperty({ description: 'The average travelled distance in meters.'})
  averageDistance: number;

  /**
   * The average speed in kilometers per hour for this week.
   */
  @IsDefined()
  @ApiProperty({ description: 'The average speed in kilometers per hour.'})
  averageSpeed: number;
}
