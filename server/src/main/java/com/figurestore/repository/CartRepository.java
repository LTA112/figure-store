package com.figurestore.repository;

import com.figurestore.entity.Cart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository
        extends JpaRepository<Cart, Long> {

    Optional<Cart> findByUserId(
            Long userId
    );

    Optional<Cart> findByUserEmailIgnoreCase(
            String email
    );

    /*
     * Tải luôn items và product để merge giỏ
     * trong một transaction, tránh lỗi lazy
     * hoặc insert trùng.
     */
    @EntityGraph(
            attributePaths = {
                    "items",
                    "items.product"
            }
    )
    Optional<Cart> findWithItemsByUserId(
            Long userId
    );

    @EntityGraph(
            attributePaths = {
                    "items",
                    "items.product"
            }
    )
    Optional<Cart> findWithItemsByUserEmailIgnoreCase(
            String email
    );
}