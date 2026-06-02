package com.figurestore.service.impl;

import com.figurestore.dto.request.LoginRequest;
import com.figurestore.dto.request.RegisterRequest;
import com.figurestore.entity.User;
import com.figurestore.repository.UserRepository;
import com.figurestore.service.interfaces.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public String register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already exists";
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role("USER")
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        return "Register success";
    }

    @Override
    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            return "User not found";
        }

        boolean match = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!match) {
            return "Wrong password";
        }

        return "Login success";
    }
}