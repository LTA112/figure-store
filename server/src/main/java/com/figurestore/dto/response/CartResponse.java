package com.figurestore.dto.response;

import com.figurestore.entity.Cart;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {

    private Long id;

    private List<CartItemResponse> items;

    private Integer totalItems;

    private Integer totalQuantity;

    private BigDecimal totalAmount;

    public static CartResponse fromEntity(
            Cart cart
    ) {
        List<CartItemResponse> items =
                cart.getItems()
                        .stream()
                        .map(
                                CartItemResponse
                                        ::fromEntity
                        )
                        .toList();

        int totalQuantity =
                items.stream()
                        .mapToInt(
                                CartItemResponse
                                        ::getQuantity
                        )
                        .sum();

        BigDecimal totalAmount =
                items.stream()
                        .map(
                                CartItemResponse
                                        ::getSubtotal
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .totalItems(items.size())
                .totalQuantity(
                        totalQuantity
                )
                .totalAmount(totalAmount)
                .build();
    }

    public static CartResponse empty() {
        return CartResponse.builder()
                .id(null)
                .items(List.of())
                .totalItems(0)
                .totalQuantity(0)
                .totalAmount(
                        BigDecimal.ZERO
                )
                .build();
    }
}