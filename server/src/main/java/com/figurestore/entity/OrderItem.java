package com.figurestore.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(
        name = "order_items",
        indexes = {
                @Index(
                        name = "idx_order_items_order",
                        columnList = "order_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "order_id",
            nullable = false
    )
    private Order order;

    @Column(
            name = "product_id",
            nullable = false
    )
    private Long productId;

    @Column(
            name = "product_name",
            nullable = false,
            length = 200
    )
    private String productName;

    @Column(
            name = "thumbnail_url",
            length = 1000
    )
    private String thumbnailUrl;

    @Column(
            name = "unit_price",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal subtotal;
}