// src/agents/detective/services/caching.service.ts

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import type { Redis as RedisType } from 'ioredis';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  compress?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

@Injectable()
export class CachingService implements OnModuleDestroy {
  private readonly logger = new Logger('💾 CachingService');
  private readonly redis: RedisType;
  private readonly defaultTtl = 3600;
  private readonly keyPrefix = 'detective:';
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
  };

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://redis:6379');
    
    try {
      // ✅ Fixed: Only use valid RedisOptions properties
      const redisOptions: RedisOptions = {
        // Basic connection options
        connectTimeout: 10000,
        commandTimeout: 5000,

        // Retry and reconnection strategy
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        
        // Connection management
        enableReadyCheck: false,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        
        // Key prefixing
        keyPrefix: this.keyPrefix,
        
        // Offline queue management
        enableOfflineQueue: false,
        
        // Auto reconnection
        autoResubscribe: true,
        autoResendUnfulfilledCommands: false
      };
        
        if (!redisUrl) {
            throw new Error("Missing REDIS_URL in evironment");
      }

      this.redis = new Redis(redisUrl, redisOptions);

      this.redis.on('connect', () => {
        this.logger.log('✅ Connected to Redis');
      });

      this.redis.on('error', (error: Error) => {
        this.logger.error(`❌ Redis error: ${error.message}`);
      });

      this.redis.on('ready', () => {
        this.logger.log('🚀 Redis ready for operations');
      });

      this.redis.on('reconnecting', (timeToReconnect: number) => {
        this.logger.warn(`🔄 Redis reconnecting in ${timeToReconnect}ms`);
      });

    } catch (error) {
      this.logger.error(`❌ Failed to initialize Redis: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  // ... rest of your existing methods remain exactly the same
  
  public async get<T>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const cached = await this.redis.get(key);
      const duration = Date.now() - startTime;
      
      if (cached === null) {
        this.stats.misses++;
        this.updateHitRate();
        this.logger.debug(`❌ Cache miss: ${key} (${duration}ms)`);
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      this.logger.debug(`✅ Cache hit: ${key} (${duration}ms)`);
      
      return this.deserialize<T>(cached);

    } catch (error) {
      this.logger.error(`❌ Cache get failed for key ${key}: ${this.getErrorMessage(error)}`);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttl?: number, options?: CacheOptions): Promise<boolean> {
    try {
      const startTime = Date.now();
      const serialized = this.serialize(value);
      const effectiveTtl = ttl || options?.ttl || this.defaultTtl;
      
      let result: string | null;
      if (effectiveTtl > 0) {
        result = await this.redis.setex(key, effectiveTtl, serialized);
      } else {
        result = await this.redis.set(key, serialized);
      }
      
      const duration = Date.now() - startTime;
      const success = result === 'OK';
      
      if (success) {
        this.stats.sets++;
        this.logger.debug(`✅ Cache set: ${key} (TTL: ${effectiveTtl}s, ${duration}ms)`);
      }
      
      return success;

    } catch (error) {
      this.logger.error(`❌ Cache set failed for key ${key}: ${this.getErrorMessage(error)}`);
      return false;
    }
  }

  public async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      const success = result > 0;
      
      if (success) {
        this.stats.deletes++;
        this.logger.debug(`✅ Cache delete: ${key}`);
      }
      
      return success;

    } catch (error) {
      this.logger.error(`❌ Cache delete failed for key ${key}: ${this.getErrorMessage(error)}`);
      return false;
    }
  }

  public async clear(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      this.logger.log('🧹 Cache cleared');
      return true;
    } catch (error) {
      this.logger.error(`❌ Cache clear failed: ${this.getErrorMessage(error)}`);
      return false;
    }
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('👋 Redis connection closed');
    } catch (error) {
      this.logger.error(`❌ Error closing Redis: ${this.getErrorMessage(error)}`);
    }
  }

  private serialize<T>(value: T): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      this.logger.error(`❌ Serialization failed: ${this.getErrorMessage(error)}`);
      throw new Error('Failed to serialize cache value');
    }
  }

  private deserialize<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`❌ Deserialization failed: ${this.getErrorMessage(error)}`);
      throw new Error('Failed to deserialize cache value');
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
