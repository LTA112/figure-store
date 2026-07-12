package com.figurestore.dto.response;

import com.figurestore.entity.ProductImage;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductImageResponse {

    private Long id;

    private String imageUrl;

    private Integer displayOrder;

    public static ProductImageResponse fromEntity(
            ProductImage image
    ) {
        return ProductImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .displayOrder(image.getDisplayOrder())
                .build();
    }
}