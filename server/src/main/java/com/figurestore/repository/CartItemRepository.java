package com.figurestore.repository;

import com.figurestore.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository
        extends JpaRepository<CartItem, Long> {

    Optional<CartItem>
    findByCartIdAndProductId(
            Long cartId,
            Long productId
    );

    Optional<CartItem>
    findByIdAndCartUserEmailIgnoreCase(
            Long itemId,
            String email
    );

    void deleteAllByProductId(Long productId);
}