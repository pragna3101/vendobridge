import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export class StorageService {
  private static uploadDir = path.join(__dirname, '../../uploads');

  static init() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info(`Storage directory created at: ${this.uploadDir}`);
    }
  }

  static async saveFile(fileName: string, content: Buffer): Promise<string> {
    this.init();
    const filePath = path.join(this.uploadDir, fileName);
    fs.writeFileSync(filePath, content);
    return `/uploads/${fileName}`;
  }

  static getFilePath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }

  static getUploadDir(): string {
    this.init();
    return this.uploadDir;
  }
}
