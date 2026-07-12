package com.figurestore.dto.response;

import com.figurestore.entity.CartItem;
import com.figurestore.entity.Product;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long id;

    private Long productId;

    private String productName;

    private String productSlug;

    private String thumbnailUrl;

    private BigDecimal originalPrice;

    private BigDecimal sellingPrice;

    private Integer quantity;

    private Integer stockQuantity;

    private String productStatus;

    private BigDecimal subtotal;

    public static CartItemResponse fromEntity(
            CartItem item
    ) {
        Product product =
                item.getProduct();

        BigDecimal sellingPrice =
                product.getDiscountPrice() != null
                        && product.getDiscountPrice()
                        .compareTo(BigDecimal.ZERO) > 0
                        ? product.getDiscountPrice()
                        : product.getPrice();

        BigDecimal subtotal =
                sellingPrice.multiply(
                        BigDecimal.valueOf(
                                item.getQuantity()
                        )
                );

        return CartItemResponse.builder()
                .id(item.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productSlug(product.getSlug())
                .thumbnailUrl(
                        product.getThumbnailUrl()
                )
                .originalPrice(
                        product.getPrice()
                )
                .sellingPrice(
                        sellingPrice
                )
                .quantity(
                        item.getQuantity()
                )
                .stockQuantity(
                        product.getStockQuantity()
                )
                .productStatus(
                        product.getStatus().name()
                )
                .subtotal(subtotal)
                .build();
    }
}