import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

import fs from 'fs';
import path from 'path';

dotenv.config();

// Tell the Admin SDK to use the emulator
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';

const defaultBucket = `${process.env.PROJECT_ID}.appspot.com`;

initializeApp({
  projectId: process.env.PROJECT_ID,
  storageBucket: defaultBucket,
});

const bucket = getStorage().bucket();

async function uploadDirectory(localDir: string, remotePrefix = '') {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(localDir, entry.name);

    if (entry.isDirectory()) {
      await uploadDirectory(
        fullPath,
        path.posix.join(remotePrefix, entry.name),
      );
    } else {
      const destination = path.posix.join(remotePrefix, entry.name);

      console.log(`Uploading ${destination}`);

      await bucket.upload(fullPath, {
        destination,
      });
    }
  }
}

async function main() {
  await uploadDirectory('./data/files-seed/environments', 'environments/');

  await uploadDirectory('./data/files-seed/items', 'items/');
  console.log('Done!');
}

main().catch(console.error);
