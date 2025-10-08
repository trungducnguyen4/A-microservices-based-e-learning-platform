/**
 * Application configuration
 */
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // File upload configuration
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/avi',
    'video/mov'
  ],
  
  // Storage directories
  storageDirs: [
    'assignments',
    'course-materials', 
    'profile-images',
    'videos',
    'documents',
    'thumbnails',
    'temp'
  ],
  
  // Image processing configuration
  thumbnail: {
    width: 300,
    height: 300,
    quality: 80,
    format: 'jpeg'
  },
  
  // Cache configuration
  cache: {
    maxAge: 31557600, // 1 year in seconds
    enabled: true
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
  },
  
  // File type specific configurations
  fileTypeConfig: {
    images: {
      maxSize: '10MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      generateThumbnail: true
    },
    videos: {
      maxSize: '500MB',
      allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/webm'],
      generateThumbnail: false
    },
    documents: {
      maxSize: '50MB',
      allowedTypes: [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      generateThumbnail: false
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};

/**
 * Get file size in bytes from string format (e.g., "10MB")
 * @param {string} sizeStr - Size string
 * @returns {number} - Size in bytes
 */
export const parseFileSize = (sizeStr) => {
  const sizeMap = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };
  
  const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
  if (match) {
    return parseInt(match[1]) * sizeMap[match[2].toUpperCase()];
  }
  return 50 * 1024 * 1024; // Default 50MB
};

export default config;