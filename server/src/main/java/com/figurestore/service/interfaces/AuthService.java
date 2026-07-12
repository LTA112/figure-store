package com.figurestore.service.interfaces;

import com.figurestore.dto.request.LoginRequest;
import com.figurestore.dto.request.RegisterRequest;
import com.figurestore.dto.response.AuthResponse;
import com.figurestore.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);
}