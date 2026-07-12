package com.figurestore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MergeCartRequest {

    @NotEmpty(
            message = "Giỏ hàng guest không được để trống"
    )
    @Size(
            max = 100,
            message = "Giỏ hàng không được vượt quá 100 sản phẩm"
    )
    @Valid
    private List<AddCartItemRequest> items;
}