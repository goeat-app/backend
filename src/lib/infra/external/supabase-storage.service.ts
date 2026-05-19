import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageService } from './storage.service.interface';

@Injectable()
export class SupabaseStorageService extends IStorageService {
  private client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      const url = this.configService.get<string>('SUPABASE_URL');
      const serviceRoleKey = this.configService.get<string>(
        'SUPABASE_SERVICE_ROLE_KEY',
      );

      if (!url || !serviceRoleKey) {
        throw new Error(
          'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined',
        );
      }

      this.client = createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.client;
  }

  async uploadFile(
    bucket: string,
    path: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    const client = this.getClient();
    const { error } = await client.storage.from(bucket).upload(path, buffer, {
      contentType: mimetype,
      upsert: true,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to upload file to storage: ${error.message}`,
      );
    }

    return path;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client.storage.from(bucket).remove([path]);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete file from storage: ${error.message}`,
      );
    }
  }
}
