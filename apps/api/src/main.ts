import { log } from '@monorepo/logger';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { patchNestJsSwagger } from 'nestjs-zod';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

const nodeRequire = createRequire(__filename);

/**
 * @nestjs/swagger@11 doesn't export SchemaObjectFactory through its `exports`
 * map, so nestjs-zod's default deep require fails. Resolve the file by absolute
 * path (which bypasses the exports restriction) and hand it to the patcher.
 */
function resolveSchemaObjectFactory(): unknown {
  const pkg = nodeRequire.resolve('@nestjs/swagger/package.json');
  const factoryPath = join(
    dirname(pkg),
    'dist/services/schema-object-factory',
  );
  return nodeRequire(factoryPath).SchemaObjectFactory;
}

async function bootstrap(): Promise<void> {
  // Make Swagger understand Zod-based DTOs (createZodDto).
  patchNestJsSwagger(resolveSchemaObjectFactory() as never);

  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: config.get('WEB_ORIGIN'), credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('musicall API')
    .setDescription(
      "REST API for musicall — a musician's second brain. See CONTEXT.md for the domain glossary.",
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get('PORT');
  await app.listen(port);
  log(`api running on http://localhost:${port} (docs at /docs)`);
}

void bootstrap();
