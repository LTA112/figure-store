package com.figurestore.repository;

import com.figurestore.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByRequestId(String requestId);

    Optional<PaymentTransaction> findByProviderTransactionId(
            String providerTransactionId
    );
}