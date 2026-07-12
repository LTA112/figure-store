package com.figurestore.repository;

import com.figurestore.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository
        extends JpaRepository<Category, Long> {

    Optional<Category> findBySlugIgnoreCase(String slug);

    boolean existsByNameIgnoreCase(String name);

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsByNameIgnoreCaseAndIdNot(
            String name,
            Long id
    );

    boolean existsBySlugIgnoreCaseAndIdNot(
            String slug,
            Long id
    );

    List<Category> findAllByActiveTrueOrderByNameAsc();

    List<Category> findAllByOrderByCreatedAtDesc();
}