package com.figurestore.dto.request;

import com.figurestore.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(

        @NotNull(message = "Trạng thái đơn hàng không được để trống")
        OrderStatus status

) {
}