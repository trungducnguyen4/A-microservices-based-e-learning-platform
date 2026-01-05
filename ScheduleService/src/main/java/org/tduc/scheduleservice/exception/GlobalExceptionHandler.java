package org.tduc.scheduleservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.tduc.scheduleservice.dto.request.ApiResponse;
import org.tduc.scheduleservice.exception.AppException;
import org.tduc.scheduleservice.exception.ErrorCode;

import java.util.Objects;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        ApiResponse apiResponse = new ApiResponse();
        String fieldName = exception.getFieldError().getField();
        String message = exception.getFieldError().getDefaultMessage();
        
        apiResponse.setCode(HttpStatus.BAD_REQUEST.value());
        apiResponse.setMessage("Validation error: " + fieldName + " - " + message);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorcode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse<>();
        apiResponse.setCode(errorcode.getCode());
        apiResponse.setMessage(errorcode.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiResponse);
    }

    @ExceptionHandler(value = Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    ResponseEntity<ApiResponse> handlingGenericException(Exception exception) {
        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(HttpStatus.INTERNAL_SERVER_ERROR.value());
        apiResponse.setMessage("Internal server error: " + exception.getMessage());
        
        exception.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
    }
}
