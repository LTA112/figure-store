package com.figurestore.service.impl;

import com.figurestore.dto.request.LoginRequest;
import com.figurestore.dto.request.RegisterRequest;
import com.figurestore.dto.response.AuthResponse;
import com.figurestore.dto.response.UserResponse;
import com.figurestore.entity.User;
import com.figurestore.enums.UserRole;
import com.figurestore.enums.UserStatus;
import com.figurestore.exception.AppException;
import com.figurestore.repository.UserRepository;
import com.figurestore.security.JwtService;
import com.figurestore.service.interfaces.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        String phone = request.getPhone() == null
                ? null
                : request.getPhone().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "Email đã được sử dụng"
            );
        }

        if (phone != null
                && !phone.isBlank()
                && userRepository.existsByPhone(phone)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "Số điện thoại đã được sử dụng"
            );
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .password(
                        passwordEncoder.encode(request.getPassword())
                )
                .phone(
                        phone == null || phone.isBlank()
                                ? null
                                : phone
                )
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        return buildAuthResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new AppException(
                                HttpStatus.UNAUTHORIZED,
                                "Email hoặc mật khẩu không chính xác"
                        )
                );

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa"
            );
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException exception) {
            throw new AppException(
                    HttpStatus.UNAUTHORIZED,
                    "Email hoặc mật khẩu không chính xác"
            );
        } catch (DisabledException | LockedException exception) {
            throw new AppException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa"
            );
        }

        return buildAuthResponse(user);
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new AppException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy tài khoản"
                        )
                );

        return UserResponse.fromEntity(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(user))
                .build();
    }
}