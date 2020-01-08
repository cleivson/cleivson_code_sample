import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureSwagger(app);

  app.useLogger(console);

  await app.listen(3000);
}

function configureSwagger(app) {
  const options = new DocumentBuilder()
    .setTitle('Jogging Tracker')
    .setDescription('Jogging Tracker is an API for registering jogging activities and keeping track of exercises.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
}

bootstrap();
