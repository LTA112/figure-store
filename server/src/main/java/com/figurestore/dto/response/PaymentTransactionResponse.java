package com.figurestore.dto.response;

import com.figurestore.enums.PaymentMethod;
import com.figurestore.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentTransactionResponse(
        Long id,
        PaymentMethod provider,
        String providerTransactionId,
        String requestId,
        BigDecimal amount,
        PaymentStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}