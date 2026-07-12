package com.figurestore.controller;

import com.figurestore.dto.request.CancelOrderRequest;
import com.figurestore.dto.request.CreateOrderRequest;
import com.figurestore.dto.response.ApiResponse;
import com.figurestore.dto.response.OrderResponse;
import com.figurestore.dto.response.PaymentUrlResponse;
import com.figurestore.service.interfaces.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService service;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(
            Authentication authentication,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Đặt hàng thành công",
                                service.create(
                                        authentication.getName(),
                                        request
                                )
                        )
                );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> mine(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy đơn hàng thành công",
                        service.mine(
                                authentication.getName()
                        )
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> detail(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy chi tiết đơn hàng thành công",
                        service.detail(
                                authentication.getName(),
                                id
                        )
                )
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Hủy đơn hàng thành công",
                        service.cancel(
                                authentication.getName(),
                                id,
                                request.reason()
                        )
                )
        );
    }

    @PostMapping("/{id}/payment-url")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> pay(
            Authentication authentication,
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tạo liên kết thanh toán thành công",
                        service.createPayment(
                                authentication.getName(),
                                id,
                                request.getRemoteAddr()
                        )
                )
        );
    }

    @PostMapping("/{orderCode}/zalopay/verify")
    public ResponseEntity<ApiResponse<OrderResponse>>
    verifyZaloPayPayment(
            Authentication authentication,
            @PathVariable String orderCode
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Kiểm tra thanh toán ZaloPay thành công",
                        service.verifyZaloPayPayment(
                                authentication.getName(),
                                orderCode
                        )
                )
        );
    }
}