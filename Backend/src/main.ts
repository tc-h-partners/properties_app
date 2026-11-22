import 'dotenv/config';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: true,
  });

    // Global API prefix: /api/v1
    app.setGlobalPrefix('api/v1', {
      exclude: ['/'],
    });

      // Global Validation Pipe
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
        }),
      );

          // Swagger Documentation Setup
          const config = new DocumentBuilder()
            .setTitle('Property Investor CFO Platform API')
            .setDescription(
              'Production-grade NestJS backend API powering the Property Investor CFO Platform for financial and property advisory firms.',
            )
            .setVersion('1.0.0')
            .addBearerAuth(
              {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter your JWT access token',
                in: 'header',
              },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Property Investor CFO API running at http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger documentation available at http://localhost:${port}/docs`);
}

void bootstrap();
