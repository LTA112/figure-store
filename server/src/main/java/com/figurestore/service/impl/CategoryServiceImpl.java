package com.figurestore.service.impl;

import com.figurestore.dto.request.CategoryRequest;
import com.figurestore.dto.response.CategoryResponse;
import com.figurestore.entity.Category;
import com.figurestore.exception.AppException;
import com.figurestore.repository.CategoryRepository;
import com.figurestore.repository.ProductRepository;
import com.figurestore.service.interfaces.CategoryService;
import com.figurestore.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl
        implements CategoryService {

    private final CategoryRepository categoryRepository;

    private final ProductRepository productRepository;

    @Override
    public List<CategoryResponse> getPublicCategories() {
        return categoryRepository
                .findAllByActiveTrueOrderByNameAsc()
                .stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    public List<CategoryResponse> getAdminCategories() {
        return categoryRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    public CategoryResponse getById(Long id) {
        return CategoryResponse.fromEntity(
                findCategory(id)
        );
    }

    @Override
    @Transactional
    public CategoryResponse create(
            CategoryRequest request
    ) {
        String name = request.getName().trim();

        String slug = resolveSlug(
                request.getSlug(),
                name
        );

        validateUnique(null, name, slug);

        Category category = Category.builder()
                .name(name)
                .slug(slug)
                .description(
                        normalizeNullable(
                                request.getDescription()
                        )
                )
                .active(
                        request.getActive() == null
                                || request.getActive()
                )
                .build();

        return CategoryResponse.fromEntity(
                categoryRepository.save(category)
        );
    }

    @Override
    @Transactional
    public CategoryResponse update(
            Long id,
            CategoryRequest request
    ) {
        Category category = findCategory(id);

        String name = request.getName().trim();

        String slug = resolveSlug(
                request.getSlug(),
                name
        );

        validateUnique(id, name, slug);

        category.setName(name);
        category.setSlug(slug);
        category.setDescription(
                normalizeNullable(
                        request.getDescription()
                )
        );

        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }

        return CategoryResponse.fromEntity(
                categoryRepository.save(category)
        );
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Category category = findCategory(id);

        if (productRepository.existsByCategoryId(id)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa danh mục đang có sản phẩm"
            );
        }

        categoryRepository.delete(category);
    }

    private Category findCategory(Long id) {
        return categoryRepository
                .findById(id)
                .orElseThrow(
                        () -> new AppException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy danh mục"
                        )
                );
    }

    private void validateUnique(
            Long currentId,
            String name,
            String slug
    ) {
        boolean duplicatedName =
                currentId == null
                        ? categoryRepository
                        .existsByNameIgnoreCase(name)
                        : categoryRepository
                        .existsByNameIgnoreCaseAndIdNot(
                                name,
                                currentId
                        );

        if (duplicatedName) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "Tên danh mục đã tồn tại"
            );
        }

        boolean duplicatedSlug =
                currentId == null
                        ? categoryRepository
                        .existsBySlugIgnoreCase(slug)
                        : categoryRepository
                        .existsBySlugIgnoreCaseAndIdNot(
                                slug,
                                currentId
                        );

        if (duplicatedSlug) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "Slug danh mục đã tồn tại"
            );
        }
    }

    private String resolveSlug(
            String requestedSlug,
            String name
    ) {
        String slug =
                requestedSlug == null
                        || requestedSlug.isBlank()
                        ? SlugUtils.toSlug(name)
                        : SlugUtils.toSlug(requestedSlug);

        if (slug.isBlank()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể tạo slug cho danh mục"
            );
        }

        return slug;
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}