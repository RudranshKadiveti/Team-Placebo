import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageResult {
  storageKey: string;
  filePath: string;
}

export interface IStorageProvider {
  saveFile(file: Express.Multer.File, subDirectory: string): Promise<StorageResult>;
  deleteFile(storageKey: string): Promise<void>;
  getFileStream?(storageKey: string): fs.ReadStream;
}

/**
 * Local Disk Storage Provider
 * Stores uploaded files safely in local uploads directory.
 * Easily interchangeable with S3/GCS providers in the future.
 */
export class LocalStorageProvider implements IStorageProvider {
  private baseUploadDir: string;

  constructor(baseUploadDir = 'uploads') {
    this.baseUploadDir = path.resolve(process.cwd(), baseUploadDir);
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, subDirectory: string): Promise<StorageResult> {
    const targetDir = path.join(this.baseUploadDir, subDirectory);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uniqueId = crypto.randomUUID();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueId}-${sanitizedOriginalName}`;
    const filePath = path.join(targetDir, filename);

    const relativeStorageKey = path.join(subDirectory, filename).replace(/\\/g, '/');

    if (file.buffer) {
      await fs.promises.writeFile(filePath, file.buffer);
    } else if (file.path) {
      await fs.promises.copyFile(file.path, filePath);
    } else {
      throw new Error('No file buffer or path provided');
    }

    return {
      storageKey: relativeStorageKey,
      filePath,
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    const fullPath = path.join(this.baseUploadDir, storageKey);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getFileStream(storageKey: string): fs.ReadStream {
    const fullPath = path.join(this.baseUploadDir, storageKey);
    return fs.createReadStream(fullPath);
  }
}

export const storageService: IStorageProvider = new LocalStorageProvider('uploads');
