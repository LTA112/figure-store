package com.figurestore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "cart_items",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_cart_items_cart_product",
                        columnNames = {
                                "cart_id",
                                "product_id"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_cart_items_cart",
                        columnList = "cart_id"
                ),
                @Index(
                        name = "idx_cart_items_product",
                        columnList = "product_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "cart_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_cart_items_carts"
            )
    )
    private Cart cart;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "product_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_cart_items_products"
            )
    )
    private Product product;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now =
                LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;

        if (quantity == null
                || quantity < 1) {
            quantity = 1;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt =
                LocalDateTime.now();
    }
}