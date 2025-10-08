/**
 * Response formatting utilities
 */

/**
 * Create success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} code - HTTP status code
 * @returns {object}
 */
export const createSuccessResponse = (data, message = 'Success', code = 200) => {
  return {
    code,
    message,
    result: data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Create error response
 * @param {string} message - Error message
 * @param {number} code - HTTP status code
 * @param {any} details - Additional error details
 * @returns {object}
 */
export const createErrorResponse = (message, code = 500, details = null) => {
  const response = {
    code,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.details = details;
  }
  
  return response;
};

/**
 * Create paginated response
 * @param {any[]} data - Array of data items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Response message
 * @returns {object}
 */
export const createPaginatedResponse = (data, page, limit, total, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    code: 200,
    message,
    result: {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Create file upload response
 * @param {object} fileInfo - File information
 * @param {string} message - Success message
 * @returns {object}
 */
export const createFileUploadResponse = (fileInfo, message = 'File uploaded successfully') => {
  return {
    code: 200,
    message,
    result: {
      ...fileInfo,
      uploadedAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Create multiple files upload response
 * @param {object[]} filesInfo - Array of file information
 * @param {string} message - Success message
 * @returns {object}
 */
export const createMultipleFilesUploadResponse = (filesInfo, message) => {
  return {
    code: 200,
    message: message || `${filesInfo.length} files uploaded successfully`,
    result: filesInfo.map(fileInfo => ({
      ...fileInfo,
      uploadedAt: new Date().toISOString()
    })),
    timestamp: new Date().toISOString()
  };
};