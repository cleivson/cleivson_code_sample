import { Test, TestingModule } from '@nestjs/testing';
import { WeatherProviderService } from './weather-provider.service';

describe('WeatherProviderService', () => {
  let service: WeatherProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeatherProviderService],
    }).compile();

    service = module.get<WeatherProviderService>(WeatherProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
