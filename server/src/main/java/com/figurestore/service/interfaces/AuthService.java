package com.figurestore.service.interfaces;

import com.figurestore.dto.request.LoginRequest;
import com.figurestore.dto.request.RegisterRequest;

public interface AuthService {

    String register(RegisterRequest request);

    String login(LoginRequest request);
}