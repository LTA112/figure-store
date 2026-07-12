package com.figurestore.dto.response;

public record PaymentUrlResponse(
        String orderCode,
        String paymentUrl,
        String provider,
        String message
) {
}