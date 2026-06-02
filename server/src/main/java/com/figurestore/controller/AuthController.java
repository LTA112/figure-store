package com.figurestore.controller;

import com.figurestore.dto.request.LoginRequest;
import com.figurestore.dto.request.RegisterRequest;
import com.figurestore.service.interfaces.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public String register(
            @RequestBody RegisterRequest request
    ) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public String login(
            @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }
}