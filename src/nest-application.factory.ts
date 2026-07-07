import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';

export async function createNestApplication() {
  const app = await NestFactory.create(AppModule);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[Endpoint] ${req.method} ${req.originalUrl ?? req.url}`);
    next();
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.enableCors();

  return app;
}
