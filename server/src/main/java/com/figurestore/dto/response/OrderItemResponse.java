package com.figurestore.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String thumbnailUrl,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal subtotal
) {
}