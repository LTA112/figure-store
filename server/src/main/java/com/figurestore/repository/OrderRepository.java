package com.figurestore.repository;

import com.figurestore.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"items"})
    Optional<Order> findByIdAndUserEmailIgnoreCase(
            Long id,
            String email
    );

    @EntityGraph(attributePaths = {"items"})
    Optional<Order> findByOrderCode(String orderCode);

    @EntityGraph(attributePaths = {"items"})
    List<Order> findAllByUserEmailIgnoreCaseOrderByCreatedAtDesc(
            String email
    );

    @EntityGraph(attributePaths = {"items", "user"})
    List<Order> findAllByOrderByCreatedAtDesc();
}