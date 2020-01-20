import { Module } from '@nestjs/common';
import { WeatherProviderService } from './weather-provider.service';

@Module({
  providers: [WeatherProviderService],
  exports: [WeatherProviderService],
})
export class WeatherModule {}
