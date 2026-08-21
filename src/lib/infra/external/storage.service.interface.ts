import type { Readable } from 'stream';

export abstract class IStorageService {
  abstract uploadFile(
    bucket: string,
    path: string,
    content: Buffer | Readable,
    mimetype: string,
  ): Promise<string>;

  abstract deleteFile(bucket: string, path: string): Promise<void>;

  abstract getDownloadUrl(bucket: string, path: string): Promise<string>;
}
