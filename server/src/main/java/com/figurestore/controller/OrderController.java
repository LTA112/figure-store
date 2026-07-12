package com.figurestore.controller;

import com.figurestore.dto.request.*;
import com.figurestore.dto.response.*;
import com.figurestore.service.interfaces.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService service;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(Authentication a,
                                                             @Valid @RequestBody CreateOrderRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt hàng thành công", service.create(a.getName(), r)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> mine(Authentication a) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy đơn hàng thành công", service.mine(a.getName())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> detail(Authentication a, @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết đơn hàng thành công", service.detail(a.getName(), id)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(Authentication a,
                                                             @PathVariable Long id,
                                                             @Valid @RequestBody CancelOrderRequest r) {
        return ResponseEntity.ok(
                ApiResponse.success("Hủy đơn hàng thành công", service.cancel(a.getName(), id, r.reason())));
    }

    @PostMapping("/{id}/payment-url")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> pay(Authentication a,
                                                               @PathVariable Long id,
                                                               HttpServletRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("Tạo liên kết thanh toán thành công",
                        service.createPayment(a.getName(), id, req.getRemoteAddr())));
    }
}