package com.figurestore.repository;

import com.figurestore.entity.Product;
import com.figurestore.enums.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long>,
        JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlugIgnoreCase(String slug);

    Optional<Product> findByIdAndStatusNot(
            Long id,
            ProductStatus status
    );

    Optional<Product> findBySlugIgnoreCaseAndStatusNot(
            String slug,
            ProductStatus status
    );

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCaseAndIdNot(
            String slug,
            Long id
    );

    boolean existsByCategoryId(Long categoryId);
}