import { Injectable } from '@nestjs/common';
import { JoggingEntry } from 'jogging';
import { WeeklyReportDto } from 'jogging/dto';
import moment = require('moment');

const WEEK_YEAR_FORMAT = 'WW-GGGG';

/**
 * Responsible for generating the weekly jogging report.
 */
@Injectable()
export class WeeklyReportGenerator {

  /**
   * Generates a weekly jogging report aggregating some jogging activities by week.
   * @param joggingEntries The jogging entries that must be contained in the generated report.
   */
  generate(joggingEntries: JoggingEntry[]): WeeklyReportDto[] {
    if (!joggingEntries) {
      return [];
    }

    const entriesByWeek = new Map<string, JoggingEntry[]>();

    joggingEntries.forEach(entry => {
      const isoWeek = moment.utc(entry.date).format(WEEK_YEAR_FORMAT);

      const entriesOfSameWeek: JoggingEntry[] = entriesByWeek.get(isoWeek) ?? [];

      entriesOfSameWeek.push(entry);

      entriesByWeek.set(isoWeek, entriesOfSameWeek);
    });

    return Array.from(entriesByWeek).map(([week, entries]) => this.generateOneWeekReport(week, entries));
  }

  private generateOneWeekReport(week: string, entries: JoggingEntry[]): WeeklyReportDto {
    let totalDistanceInMeters: number = 0;
    let totalDurationHours: number = 0;

    entries.forEach(entry => {
      totalDistanceInMeters += entry.distance;
      totalDurationHours += moment.duration(entry.duration).asHours();
    });

    const averageSpeed = totalDurationHours > 0 ? (totalDistanceInMeters / 1000) / totalDurationHours : 0;
    const averageDistance = totalDistanceInMeters / entries.length;

    return { week, averageSpeed, averageDistance };
  }
}
