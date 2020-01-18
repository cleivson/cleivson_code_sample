import { Inject, Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { CONFIG_FILE_PATH } from './providers.constants';

/**
 * Service for handling configuration sources and getting system configuration values.
 */
@Injectable()
export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor(@Inject(CONFIG_FILE_PATH) filePath: string) {
    this.envConfig = dotenv.parse(fs.readFileSync(filePath));
  }

  /**
   * Obtains a configuration value.
   *
   * @param key - The key of the desired configuration.
   * @param optional - Whether the configuration key must be present or not.
   * @returns The string value for the specified configuration.
   */
  get(key: string, optional: boolean = false): string {
    let configValue = this.getFromConfigFile(key);

    if (!configValue) {
      configValue = this.getFromEnvironment(key);
    }

    if (!configValue && !optional) {
      throw new Error(`Configuration key "${key}" not found.`);
    }

    return configValue;
  }

  private getFromConfigFile(key: string): string {
    return this.envConfig[key];
  }

  private getFromEnvironment(key: string): string {
    return process.env[key];
  }
}
