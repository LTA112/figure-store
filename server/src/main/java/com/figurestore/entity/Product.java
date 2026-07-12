package com.figurestore.entity;

import com.figurestore.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "products",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_products_slug",
                        columnNames = "slug"
                )
        },
        indexes = {
                @Index(
                        name = "idx_products_name",
                        columnList = "name"
                ),
                @Index(
                        name = "idx_products_brand",
                        columnList = "brand"
                ),
                @Index(
                        name = "idx_products_status",
                        columnList = "status"
                ),
                @Index(
                        name = "idx_products_category",
                        columnList = "category_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 220)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(
            name = "discount_price",
            precision = 15,
            scale = 2
    )
    private BigDecimal discountPrice;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "sold_quantity", nullable = false)
    @Builder.Default
    private Integer soldQuantity = 0;

    @Column(name = "scale_ratio", length = 50)
    private String scaleRatio;

    @Column(length = 100)
    private String material;

    @Column(length = 100)
    private String brand;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "thumbnail_public_id", length = 300)
    private String thumbnailPublicId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean featured = false;

    @Column(name = "new_product", nullable = false)
    @Builder.Default
    private Boolean newProduct = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "category_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_products_categories"
            )
    )
    private Category category;

    @OneToMany(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("displayOrder ASC, id ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addImage(ProductImage image) {
        images.add(image);
        image.setProduct(this);
    }

    public void removeImage(ProductImage image) {
        images.remove(image);
        image.setProduct(null);
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;

        normalizeDefaults();
        updateStatusFromStock();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();

        normalizeDefaults();
        updateStatusFromStock();
    }

    private void normalizeDefaults() {
        if (stockQuantity == null) {
            stockQuantity = 0;
        }

        if (soldQuantity == null) {
            soldQuantity = 0;
        }

        if (featured == null) {
            featured = false;
        }

        if (newProduct == null) {
            newProduct = false;
        }

        if (status == null) {
            status = ProductStatus.ACTIVE;
        }
    }

    private void updateStatusFromStock() {
        if (status == ProductStatus.INACTIVE) {
            return;
        }

        if (stockQuantity <= 0) {
            status = ProductStatus.OUT_OF_STOCK;
        } else if (status == ProductStatus.OUT_OF_STOCK) {
            status = ProductStatus.ACTIVE;
        }
    }
}