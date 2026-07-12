package com.figurestore.dto.response;

import com.figurestore.entity.Product;
import com.figurestore.enums.ProductStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ProductResponse {

    private Long id;

    private String name;

    private String slug;

    private String description;

    private BigDecimal price;

    private BigDecimal discountPrice;

    private BigDecimal sellingPrice;

    private Integer stockQuantity;

    private Integer soldQuantity;

    private String scaleRatio;

    private String material;

    private String brand;

    private String thumbnailUrl;

    private ProductStatus status;

    private Boolean featured;

    private Boolean newProduct;

    private CategoryResponse category;

    private List<ProductImageResponse> images;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static ProductResponse fromEntity(Product product) {
        BigDecimal sellingPrice =
                product.getDiscountPrice() != null
                        ? product.getDiscountPrice()
                        : product.getPrice();

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .sellingPrice(sellingPrice)
                .stockQuantity(product.getStockQuantity())
                .soldQuantity(product.getSoldQuantity())
                .scaleRatio(product.getScaleRatio())
                .material(product.getMaterial())
                .brand(product.getBrand())
                .thumbnailUrl(product.getThumbnailUrl())
                .status(product.getStatus())
                .featured(product.getFeatured())
                .newProduct(product.getNewProduct())
                .category(
                        CategoryResponse.fromEntity(
                                product.getCategory()
                        )
                )
                .images(
                        product.getImages()
                                .stream()
                                .map(ProductImageResponse::fromEntity)
                                .toList()
                )
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}