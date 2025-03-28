import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('Accounting AI API')
    .setDescription('The API for the Accounting AI Slack bot with QuickBooks integration')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('quickbooks', 'QuickBooks integration endpoints')
    .addTag('slack', 'Slack integration endpoints')
    .addTag('analysis', 'Financial analysis endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Accounting AI API Documentation',
  });
} 