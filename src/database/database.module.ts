import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from 'config';
import { getConnectionOptions } from 'typeorm';

const CONNECTION_NAME_CONFIG_KEY = 'db_connectionName';
const KEEP_CONNECTION_CONFIG_KEY = 'db_keepConnectionAlive';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        let connectionOptions: TypeOrmModuleOptions = await getConnectionOptions(configService.get(CONNECTION_NAME_CONFIG_KEY, true));

        // Creating a database connection with a specific name would require all subsequent connections to specify this name
        connectionOptions = { ...connectionOptions, name: 'default' };

        const keepConnection = configService.get(KEEP_CONNECTION_CONFIG_KEY, true);
        connectionOptions.keepConnectionAlive = keepConnection && keepConnection === 'true';

        return connectionOptions;
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }
