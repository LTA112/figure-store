package com.figurestore.specification;

import com.figurestore.entity.Product;
import com.figurestore.enums.ProductStatus;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public final class ProductSpecification {

    private ProductSpecification() {
    }

    public static Specification<Product> keyword(
            String keyword
    ) {
        return (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) {
                return builder.conjunction();
            }

            String pattern =
                    "%" + keyword.trim().toLowerCase() + "%";

            return builder.or(
                    builder.like(
                            builder.lower(root.get("name")),
                            pattern
                    ),
                    builder.like(
                            builder.lower(root.get("brand")),
                            pattern
                    ),
                    builder.like(
                            builder.lower(root.get("description")),
                            pattern
                    )
            );
        };
    }

    public static Specification<Product> categoryId(
            Long categoryId
    ) {
        return (root, query, builder) -> {
            if (categoryId == null) {
                return builder.conjunction();
            }

            return builder.equal(
                    root.get("category").get("id"),
                    categoryId
            );
        };
    }

    public static Specification<Product> brand(
            String brand
    ) {
        return (root, query, builder) -> {
            if (brand == null || brand.isBlank()) {
                return builder.conjunction();
            }

            return builder.equal(
                    builder.lower(root.get("brand")),
                    brand.trim().toLowerCase()
            );
        };
    }

    public static Specification<Product> minimumPrice(
            BigDecimal minPrice
    ) {
        return (root, query, builder) -> {
            if (minPrice == null) {
                return builder.conjunction();
            }

            return builder.greaterThanOrEqualTo(
                    builder.coalesce(
                            root.get("discountPrice"),
                            root.get("price")
                    ),
                    minPrice
            );
        };
    }

    public static Specification<Product> maximumPrice(
            BigDecimal maxPrice
    ) {
        return (root, query, builder) -> {
            if (maxPrice == null) {
                return builder.conjunction();
            }

            return builder.lessThanOrEqualTo(
                    builder.coalesce(
                            root.get("discountPrice"),
                            root.get("price")
                    ),
                    maxPrice
            );
        };
    }

    public static Specification<Product> status(
            ProductStatus status
    ) {
        return (root, query, builder) -> {
            if (status == null) {
                return builder.conjunction();
            }

            return builder.equal(root.get("status"), status);
        };
    }

    public static Specification<Product> publicProduct() {
        return (root, query, builder) ->
                builder.notEqual(
                        root.get("status"),
                        ProductStatus.INACTIVE
                );
    }

    public static Specification<Product> featured(
            Boolean featured
    ) {
        return (root, query, builder) -> {
            if (featured == null) {
                return builder.conjunction();
            }

            return builder.equal(
                    root.get("featured"),
                    featured
            );
        };
    }

    public static Specification<Product> newProduct(
            Boolean newProduct
    ) {
        return (root, query, builder) -> {
            if (newProduct == null) {
                return builder.conjunction();
            }

            return builder.equal(
                    root.get("newProduct"),
                    newProduct
            );
        };
    }
}