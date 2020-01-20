import { BadRequestException, Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ConfigService } from 'config';
import { WeatherCondition } from './weather-condition.dto';
import moment = require('moment');

const WEATHER_API_KEY_CONFIG = 'WEATHER_API_KEY';
const WEATHER_API_URL_CONFIG = 'WEATHER_API_URL';

const API_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Provides historical information about the weather in places around the world.
 */
@Injectable()
export class WeatherProviderService {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get(WEATHER_API_KEY_CONFIG);
    this.apiUrl = configService.get(WEATHER_API_URL_CONFIG);
  }

  /**
   * Gets the weather condition for a specific city in a specific datetime.
   * @param location The name of the city to check for the weather condition.
   * @param date A string containing a representation of the date of the weather condition.
   * @param time A string containing a representation of the time of the weather condition.
   * @throws BadRequestException if the location, date or time is not valid.
   */
  async getWeatherCondition(location: string, date: string, time: string): Promise<WeatherCondition> {

    let response: AxiosResponse;

    const requestDate: string = this.getRequestDate(date);

    const requestedHour: number = this.getRequestHour(time);

    try {
      response = await this.getWeatherFromApi(response, location, requestDate);
    } catch (e) {
      this.throwInvalidLocationException(location);
    }

    this.validateError(response, date, location);

    // Indexing in 0 since we only asked for one day
    const dayWeatherConditions = response.data.data.weather[0];

    // Hour minus one because it's zero-indexed
    const hourWeatherConditions = dayWeatherConditions.hourly[requestedHour - 1];

    const weatherDescriptions = this.joinWeatherDescriptions(hourWeatherConditions);
    const weatherCondition = `${hourWeatherConditions.tempC}ºC ${weatherDescriptions}`;

    const apiLocation: string = response.data.data.request[0].query;

    return { description: weatherCondition, location: apiLocation };
  }

  private translateError(errors: any[], date: string, location: string) {
    errors.forEach(error => {
      if (error.msg === 'There is no weather data available for the date provided.') {
        this.throwFutureDateException(date);
      } else {
        this.throwInvalidLocationException(location);
      }
    });
  }

  private getRequestDate(date: string) {
    const momentDate = moment.utc(date);

    if (!momentDate.isValid()) {
      this.throwInvalidDateException(date);
    }

    return momentDate.format(API_DATE_FORMAT);
  }

  private getRequestHour(time: string): number {
    const momentTime = moment.utc(time, 'hh:mm:ss');

    if (!momentTime.isValid()) {
      throw new BadRequestException(`Invalid jogging time format ${time}`);
    }

    return momentTime.hours();
  }

  private async getWeatherFromApi(response: AxiosResponse<any>, location: string, date: string) {
    return axios.get(this.apiUrl, {
      params: {
        q: location,
        date,
        key: this.apiKey,
        tp: 1, // Time Period: 1 hour - brings the data hourly
        format: 'json',
        extra: 'utcDateTime',
      },
    });
  }

  private validateError(response: AxiosResponse<any>, date: string, location: string) {
    if (!response.data.data || !response.data.data.weather) {
      if (response.data.data.error) {
        this.translateError(response.data.data.error, date, location);
      } else {
        throw new BadRequestException();
      }
    }
  }

  private throwInvalidDateException(date: string) {
    throw new BadRequestException(`Invalid date format ${date}`);
  }

  private throwFutureDateException(date: string) {
    throw new BadRequestException(`Date out of range ${date}`);
  }

  private throwInvalidLocationException(location: string) {
    throw new BadRequestException(`Invalid location ${location}`);
  }

  private joinWeatherDescriptions(hourWeatherConditions: any) {
    return hourWeatherConditions.weatherDesc.map(o => o.value).reduce((c1, c2) => c1 + '/' + c2);
  }
}
