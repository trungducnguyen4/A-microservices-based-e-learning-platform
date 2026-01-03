package org.tduc.homeworkservice1.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.tduc.homeworkservice1.dto.request.ApiResponse;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle custom application exceptions
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
        log.error("AppException occurred: Code={}, Message={}", ex.getErrorCode().getCode(), ex.getEffectiveMessage(), ex);
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ex.getErrorCode().getCode())
            .message(ex.getEffectiveMessage())
            .build();
        
        return ResponseEntity
            .status(ex.getErrorCode().getHttpStatus())
            .body(response);
    }

    /**
     * Handle validation errors for request body
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        log.error("Validation error occurred: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.INVALID_REQUEST.getCode())
            .message("Validation failed")
            .result(errors)
            .build();
        
        return ResponseEntity
            .status(ErrorCode.INVALID_REQUEST.getHttpStatus())
            .body(response);
    }

    /**
     * Handle missing request parameters
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingParams(MissingServletRequestParameterException ex) {
        log.error("Missing request parameter: {}", ex.getParameterName());
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.MISSING_REQUIRED_FIELD.getCode())
            .message("Missing required parameter: " + ex.getParameterName())
            .build();
        
        return ResponseEntity
            .status(ErrorCode.MISSING_REQUIRED_FIELD.getHttpStatus())
            .body(response);
    }

    /**
     * Handle type mismatch errors
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.error("Type mismatch error: {}", ex.getMessage());
        
        String message = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s", 
            ex.getValue(), ex.getName(), ex.getRequiredType().getSimpleName());
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.INVALID_REQUEST.getCode())
            .message(message)
            .build();
        
        return ResponseEntity
            .status(ErrorCode.INVALID_REQUEST.getHttpStatus())
            .body(response);
    }

    /**
     * Handle malformed JSON requests
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.error("Malformed JSON request: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.INVALID_REQUEST.getCode())
            .message("Malformed JSON request")
            .build();
        
        return ResponseEntity
            .status(ErrorCode.INVALID_REQUEST.getHttpStatus())
            .body(response);
    }

    /**
     * Handle file upload size exceeded
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        log.error("File size exceeded: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.FILE_SIZE_EXCEEDED.getCode())
            .message(ErrorCode.FILE_SIZE_EXCEEDED.getMessage())
            .build();
        
        return ResponseEntity
            .status(ErrorCode.FILE_SIZE_EXCEEDED.getHttpStatus())
            .body(response);
    }

    /**
     * Handle database constraint violations
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation: {}", ex.getMessage());
        
        String message = "Data integrity constraint violated";
        if (ex.getMessage().contains("Duplicate entry")) {
            message = "Duplicate entry detected";
        }
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.INVALID_REQUEST.getCode())
            .message(message)
            .build();
        
        return ResponseEntity
            .status(ErrorCode.INVALID_REQUEST.getHttpStatus())
            .body(response);
    }

    /**
     * Handle SQL exceptions
     */
    @ExceptionHandler(SQLException.class)
    public ResponseEntity<ApiResponse<Object>> handleSQLException(SQLException ex) {
        log.error("SQL exception occurred: {}", ex.getMessage(), ex);
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
            .message("Database error occurred")
            .build();
        
        return ResponseEntity
            .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
            .body(response);
    }

    /**
     * Handle 404 errors
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNotFound(NoHandlerFoundException ex) {
        log.error("Endpoint not found: {}", ex.getRequestURL());
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(404)
            .message("Endpoint not found: " + ex.getRequestURL())
            .build();
        
        return ResponseEntity
            .status(404)
            .body(response);
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred: ", ex);
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
            .message("An unexpected error occurred")
            .build();
        
        return ResponseEntity
            .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
            .body(response);
    }

    /**
     * Handle IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.error("Illegal argument: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.INVALID_REQUEST.getCode())
            .message(ex.getMessage())
            .build();
        
        return ResponseEntity
            .status(ErrorCode.INVALID_REQUEST.getHttpStatus())
            .body(response);
    }

    /**
     * Handle IllegalStateException
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalState(IllegalStateException ex) {
        log.error("Illegal state: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.builder()
            .code(ErrorCode.INVALID_REQUEST.getCode())
            .message(ex.getMessage())
            .build();
        
        return ResponseEntity
            .status(ErrorCode.INVALID_REQUEST.getHttpStatus())
            .body(response);
    }
}