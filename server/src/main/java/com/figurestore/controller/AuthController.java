package com.figurestore.controller;

import com.figurestore.dto.request.LoginRequest;
import com.figurestore.dto.request.RegisterRequest;
import com.figurestore.dto.response.ApiResponse;
import com.figurestore.dto.response.AuthResponse;
import com.figurestore.dto.response.UserResponse;
import com.figurestore.service.interfaces.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse result = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Đăng ký tài khoản thành công",
                        result
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse result = authService.login(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Đăng nhập thành công",
                        result
                )
        );
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            Authentication authentication
    ) {
        UserResponse result = authService.getCurrentUser(
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy thông tin tài khoản thành công",
                        result
                )
        );
    }
}