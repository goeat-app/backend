import { Readable } from 'stream';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { GooglePlacesProvider } from './google-places.provider';
import { IStorageService } from '@/lib/infra/external/storage.service.interface';

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => ({
    bucket: () => ({ name: 'test-bucket' }),
  })),
}));

describe('GooglePlacesProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createProvider = (storageService: Partial<IStorageService>) => {
    const configService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as ConfigService;

    return new GooglePlacesProvider(
      configService,
      storageService as IStorageService,
    );
  };

  it('streams image data into storage without buffering it in memory', async () => {
    const uploadFile = jest.fn().mockResolvedValue('stored/path');
    const storageService = { uploadFile } as unknown as IStorageService;
    const provider = createProvider(storageService);
    const stream = Readable.from(['image-bytes']);
    const axiosGetSpy = jest.spyOn(axios, 'get').mockResolvedValue({
      data: stream,
      headers: { 'content-type': 'image/jpeg' },
    } as never);

    await provider.getAndSaveImageByName(
      'restaurants/1/pictures',
      'image-name',
      'photo-id',
      2000,
    );

    expect(axiosGetSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ responseType: 'stream' }),
    );
    expect(uploadFile).toHaveBeenCalledWith(
      'test-bucket',
      'restaurants/1/pictures/image-name.jpeg',
      expect.any(Readable),
      'image/jpeg',
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const uploadArg = uploadFile.mock.calls[0][2];
    expect(Buffer.isBuffer(uploadArg)).toBe(false);
    expect(uploadArg).toBeInstanceOf(Readable);
  });

  it('caps requested image width at 1080px', async () => {
    const uploadFile = jest.fn().mockResolvedValue('stored/path');
    const storageService = { uploadFile } as unknown as IStorageService;
    const provider = createProvider(storageService);
    const axiosGetSpy = jest.spyOn(axios, 'get').mockResolvedValue({
      data: Readable.from(['image-bytes']),
      headers: { 'content-type': 'image/jpeg' },
    } as never);

    await provider.getAndSaveImageByName(
      'restaurants/1/pictures',
      'image-name',
      'photo-id',
      2000,
    );

    const [, requestConfig] = axiosGetSpy.mock.calls[0] as [string, unknown];
    expect(requestConfig).toMatchObject({ responseType: 'stream' });
    expect(axiosGetSpy.mock.calls[0][0]).toContain('maxWidthPx=1080');
  });
});
