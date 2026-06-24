import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env';

/** Typed accessor over the validated env (no string keys at call sites). */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) { }

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.getOrThrow(key, { infer: true });
  }
}
