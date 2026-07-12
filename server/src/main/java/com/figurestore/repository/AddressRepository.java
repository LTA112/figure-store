package com.figurestore.repository;

import com.figurestore.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddressRepository
        extends JpaRepository<Address, Long> {

    List<Address>
    findAllByUserEmailIgnoreCaseOrderByDefaultAddressDescCreatedAtDesc(
            String email
    );

    Optional<Address> findByIdAndUserEmailIgnoreCase(
            Long id,
            String email
    );

    long countByUserEmailIgnoreCase(String email);
}