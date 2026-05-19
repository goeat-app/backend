import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { IStorageService } from './storage.service.interface';

@Injectable()
export class LocalDiskStorageService extends IStorageService {
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.basePath =
      this.configService.get<string>('UPLOADS_PATH') || './uploads';
  }

  async uploadFile(
    bucket: string,
    path: string,
    buffer: Buffer,
    _mimetype: string,
  ): Promise<string> {
    try {
      const bucketPath = join(this.basePath, bucket);
      const filePath = join(bucketPath, path);
      const fileDir = join(filePath, '..');

      // Create directory if it doesn't exist
      await mkdir(fileDir, { recursive: true });

      // Write file to disk
      await writeFile(filePath, buffer);

      return path;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to save file to disk: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const filePath = join(this.basePath, bucket, path);
      await unlink(filePath);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file from disk: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
