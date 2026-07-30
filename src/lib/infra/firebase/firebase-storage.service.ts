import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService } from '../external/storage.service.interface';
import { FIREBASE_STORAGE_CONFIG } from './storage-config';

/**
 * Firebase Storage Service
 * Handles file uploads, deletions, and URL generation using Firebase Storage
 * Works with both emulator (local development) and production Firebase
 * Uses Firebase Admin SDK for all operations
 */
@Injectable()
export class FirebaseStorageService extends IStorageService {
  private bucketInitialized = false;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async uploadFile(
    bucket: string,
    path: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    try {
      const { getStorage } = await import('firebase-admin/storage');
      const storage = getStorage();
      const bucketRef = storage.bucket(`${bucket}`);
      const file = bucketRef.file(path);

      await file.save(buffer, {
        metadata: {
          contentType: mimetype,
        },
      });

      return path;
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error);
      throw new InternalServerErrorException(
        `Failed to upload file to storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { getStorage } = await import('firebase-admin/storage');
      const storage = getStorage();
      const bucketRef = storage.bucket(`${bucket}`);
      const file = bucketRef.file(path);

      await file.delete();
    } catch (error) {
      console.error('Error deleting file from Firebase Storage:', error);
      throw new InternalServerErrorException(
        `Failed to delete file from storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get download URL for a file
   * For emulator: generates a local URL
   * For production: generates a storage reference that can be used with Firebase SDK
   */
  async getDownloadUrl(bucket: string, path: string): Promise<string> {
    try {
      const isEmulator = !!process.env.AUTH_EMULATOR_HOST;

      if (isEmulator) {
        // For emulator, construct a local URL
        return `http://localhost:9199/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
      }

      // For production, get a signed/public URL via Admin SDK
      try {
        const { getStorage } = await import('firebase-admin/storage');
        const storage = getStorage();
        const bucketRef = storage.bucket(`${bucket}`);
        const file = bucketRef.file(path);

        // Generate a signed URL valid for 7 days
        const [signedUrl] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return signedUrl;
      } catch (error) {
        // Fallback to gs:// URL if signed URL generation fails
        return `gs://${bucket}/${path}`;
      }
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new InternalServerErrorException(
        `Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
