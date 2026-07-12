package com.figurestore.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCartItemRequest {

    @NotNull(
            message = "Vui lòng nhập số lượng"
    )
    @Min(
            value = 1,
            message = "Số lượng tối thiểu là 1"
    )
    private Integer quantity;
}