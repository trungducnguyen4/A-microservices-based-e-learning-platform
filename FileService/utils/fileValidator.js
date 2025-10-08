/**
 * File validation utilities
 */

// Supported file types by category
export const FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
  documents: [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-tar']
};

// File size limits by type (in bytes)
export const SIZE_LIMITS = {
  images: 10 * 1024 * 1024,      // 10MB
  videos: 500 * 1024 * 1024,     // 500MB
  documents: 50 * 1024 * 1024,   // 50MB
  audio: 100 * 1024 * 1024,      // 100MB
  archives: 100 * 1024 * 1024,   // 100MB
  default: 50 * 1024 * 1024      // 50MB
};

/**
 * Validate file type
 * @param {string} mimeType - File MIME type
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean}
 */
export const isValidFileType = (mimeType, allowedTypes = []) => {
  if (allowedTypes.length === 0) return true;
  return allowedTypes.includes(mimeType);
};

/**
 * Get file category based on MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string}
 */
export const getFileCategory = (mimeType) => {
  for (const [category, types] of Object.entries(FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'documents';
};

/**
 * Get appropriate size limit for file type
 * @param {string} mimeType - File MIME type
 * @returns {number}
 */
export const getSizeLimit = (mimeType) => {
  const category = getFileCategory(mimeType);
  return SIZE_LIMITS[category] || SIZE_LIMITS.default;
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate safe filename
 * @param {string} originalName - Original filename
 * @returns {string}
 */
export const generateSafeFilename = (originalName) => {
  // Remove special characters and spaces
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
  
  return safeName;
};

/**
 * Validate file extension matches MIME type
 * @param {string} filename - Original filename
 * @param {string} mimeType - File MIME type
 * @returns {boolean}
 */
export const validateFileExtension = (filename, mimeType) => {
  const ext = filename.toLowerCase().split('.').pop();
  
  const extensionMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/mov',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
    'zip': 'application/zip'
  };
  
  return extensionMap[ext] === mimeType;
};