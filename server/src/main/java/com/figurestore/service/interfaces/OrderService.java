package com.figurestore.service.interfaces;

import com.figurestore.dto.request.CreateOrderRequest;
import com.figurestore.dto.request.UpdateOrderStatusRequest;
import com.figurestore.dto.response.OrderResponse;
import com.figurestore.dto.response.PaymentUrlResponse;

import java.util.List;

public interface OrderService {

    OrderResponse create(
            String email,
            CreateOrderRequest request
    );

    List<OrderResponse> mine(
            String email
    );

    OrderResponse detail(
            String email,
            Long id
    );

    OrderResponse cancel(
            String email,
            Long id,
            String reason
    );

    List<OrderResponse> all();

    OrderResponse updateStatus(
            Long id,
            UpdateOrderStatusRequest request
    );

    PaymentUrlResponse createPayment(
            String email,
            Long orderId,
            String clientIp
    );

    OrderResponse verifyZaloPayPayment(
            String email,
            String orderCode
    );

    OrderResponse markPaidFromProvider(
            String orderCode,
            String providerTransactionId,
            String rawResponse
    );

    OrderResponse markPaymentFailed(
            String orderCode,
            String providerTransactionId,
            String reason,
            String rawResponse
    );
}