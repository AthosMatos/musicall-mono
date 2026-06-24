import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly configService: AppConfigService) {
    const databaseUrl = configService.get("DATABASE_URL");
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter });
  }
}
