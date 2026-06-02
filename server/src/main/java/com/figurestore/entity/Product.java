package com.figurestore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    private BigDecimal price;

    private Integer stockQuantity;

    private String scaleRatio;

    private String material;

    private String brand;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}