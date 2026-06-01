export abstract class IStorageService {
  abstract uploadFile(
    bucket: string,
    path: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string>;

  abstract deleteFile(bucket: string, path: string): Promise<void>;
}
