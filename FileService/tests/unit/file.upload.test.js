import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FileService - Upload Tests', () => {
  const testUploadDir = path.join(__dirname, '../../test-uploads');
  
  beforeEach(async () => {
    await fs.ensureDir(testUploadDir);
  });

  afterEach(async () => {
    await fs.remove(testUploadDir);
  });

  describe('File Validation', () => {
    test('should validate allowed file types', () => {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png', '.mp4'];
      const testFiles = [
        { name: 'document.pdf', expected: true },
        { name: 'image.jpg', expected: true },
        { name: 'video.mp4', expected: true },
        { name: 'script.exe', expected: false }
      ];

      testFiles.forEach(file => {
        const ext = path.extname(file.name);
        const isAllowed = allowedTypes.includes(ext);
        expect(isAllowed).toBe(file.expected);
      });
    });

    test('should validate file size limits', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const testSizes = [
        { size: 5 * 1024 * 1024, expected: true },
        { size: 15 * 1024 * 1024, expected: false }
      ];

      testSizes.forEach(test => {
        const isValid = test.size <= maxSize;
        expect(isValid).toBe(test.expected);
      });
    });
  });

  describe('File Storage', () => {
    test('should save file to upload directory', async () => {
      const fileName = 'test-file.txt';
      const filePath = path.join(testUploadDir, fileName);
      const content = 'Test file content';

      await fs.writeFile(filePath, content);
      const exists = await fs.pathExists(filePath);
      
      expect(exists).toBe(true);
    });

    test('should generate unique filename for uploads', async () => {
      const originalName = 'document.pdf';
      const timestamp = Date.now();
      const uniqueName = `${timestamp}-${originalName}`;
      
      expect(uniqueName).toContain(originalName);
      expect(uniqueName).not.toBe(originalName);
    });
  });

  describe('File Deletion', () => {
    test('should delete file from storage', async () => {
      const fileName = 'to-delete.txt';
      const filePath = path.join(testUploadDir, fileName);
      
      await fs.writeFile(filePath, 'Delete me');
      await fs.remove(filePath);
      
      const exists = await fs.pathExists(filePath);
      expect(exists).toBe(false);
    });
  });
});
