package com.figurestore.dto.request;

import com.figurestore.enums.PaymentMethod;
import jakarta.validation.constraints.*;

public record CreateOrderRequest(
        @NotNull Long addressId,
        @NotNull PaymentMethod paymentMethod,
        @Size(max = 1000) String note
) {
}