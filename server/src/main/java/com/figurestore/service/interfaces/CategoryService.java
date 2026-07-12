package com.figurestore.service.interfaces;

import com.figurestore.dto.request.CategoryRequest;
import com.figurestore.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getPublicCategories();

    List<CategoryResponse> getAdminCategories();

    CategoryResponse getById(Long id);

    CategoryResponse create(CategoryRequest request);

    CategoryResponse update(
            Long id,
            CategoryRequest request
    );

    void delete(Long id);
}