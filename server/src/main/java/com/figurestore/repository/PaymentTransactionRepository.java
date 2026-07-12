package com.figurestore.repository;

import com.figurestore.entity.PaymentTransaction;
import com.figurestore.enums.PaymentMethod;
import com.figurestore.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByRequestId(
            String requestId
    );

    Optional<PaymentTransaction> findByProviderTransactionId(
            String providerTransactionId
    );

    Optional<PaymentTransaction>
    findTopByOrderIdAndProviderAndStatusOrderByCreatedAtDesc(
            Long orderId,
            PaymentMethod provider,
            PaymentStatus status
    );

    List<PaymentTransaction>
    findAllByOrderIdOrderByCreatedAtDesc(
            Long orderId
    );
}