// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Add cookie parser middleware BEFORE CORS
  app.use(cookieParser());
  
  // Configure CORS properly
  app.enableCors({
    origin: 'http://localhost:3000', // Your Next.js URL
    credentials: true, // This is crucial for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(3001);
  console.log('🚀 Server running on http://localhost:3001');
}
bootstrap();
