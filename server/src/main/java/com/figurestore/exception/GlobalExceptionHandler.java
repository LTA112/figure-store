package com.figurestore.exception;

import com.figurestore.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(
            AppException exception
    ) {
        return ResponseEntity
                .status(exception.getStatus())
                .body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<
            ApiResponse<Map<String, String>>
            > handleValidation(
            MethodArgumentNotValidException exception
    ) {
        Map<String, String> errors = new LinkedHashMap<>();

        for (FieldError error
                : exception.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(
                    error.getField(),
                    error.getDefaultMessage()
            );
        }

        return ResponseEntity
                .badRequest()
                .body(
                        ApiResponse.<Map<String, String>>builder()
                                .success(false)
                                .message("Dữ liệu không hợp lệ")
                                .data(errors)
                                .build()
                );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>>
    handleConstraintViolation(
            ConstraintViolationException exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(
                        ApiResponse.error(
                                exception.getMessage()
                        )
                );
    }

    @ExceptionHandler(
            MaxUploadSizeExceededException.class
    )
    public ResponseEntity<ApiResponse<Void>>
    handleMaxUploadSize(
            MaxUploadSizeExceededException exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(
                        ApiResponse.error(
                                "Dung lượng file tải lên quá lớn"
                        )
                );
    }

    @ExceptionHandler(
            MissingServletRequestPartException.class
    )
    public ResponseEntity<ApiResponse<Void>>
    handleMissingPart(
            MissingServletRequestPartException exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(
                        ApiResponse.error(
                                "Thiếu file tải lên"
                        )
                );
    }

    @ExceptionHandler(
            MissingServletRequestParameterException.class
    )
    public ResponseEntity<ApiResponse<Void>>
    handleMissingParameter(
            MissingServletRequestParameterException exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(
                        ApiResponse.error(
                                "Thiếu tham số: "
                                        + exception.getParameterName()
                        )
                );
    }

    @ExceptionHandler(
            DataIntegrityViolationException.class
    )
    public ResponseEntity<ApiResponse<Void>>
    handleDataIntegrity(
            DataIntegrityViolationException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        ApiResponse.error(
                                "Dữ liệu bị trùng hoặc đang được sử dụng"
                        )
                );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(
            Exception exception
    ) {
        exception.printStackTrace();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(
                        ApiResponse.error(
                                "Đã xảy ra lỗi hệ thống"
                        )
                );
    }
}