package com.figurestore.dto.response;

import com.figurestore.enums.OrderStatus;
import com.figurestore.enums.PaymentMethod;
import com.figurestore.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderCode,
        String recipientName,
        String recipientPhone,
        String shippingAddress,
        String note,
        BigDecimal subtotal,
        BigDecimal shippingFee,
        BigDecimal totalAmount,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        LocalDateTime paidAt,
        LocalDateTime cancelledAt,
        String cancelReason,
        LocalDateTime createdAt,
        List<OrderItemResponse> items,
        List<PaymentTransactionResponse> payments
) {
}