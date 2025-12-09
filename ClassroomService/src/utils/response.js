/**
 * Format response thành công
 */
function successResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Format response lỗi
 */
function errorResponse(message, error = null) {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message || error;
  }

  return response;
}

/**
 * Format response với pagination
 */
function paginatedResponse(data, page, limit, total, message = 'Success') {
  return {
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
