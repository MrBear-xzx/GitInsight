import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend cross-origin requests
  app.enableCors();

  // Global exception filter — sanitize error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder().setTitle("GitInsight API").build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
  await app.listen(3000);
}

bootstrap();
