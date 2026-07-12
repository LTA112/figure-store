package com.figurestore.controller;

import com.figurestore.dto.response.ApiResponse;
import com.figurestore.dto.response.CategoryResponse;
import com.figurestore.service.interfaces.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<
            ApiResponse<List<CategoryResponse>>
            > getCategories() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh mục thành công",
                        categoryService.getPublicCategories()
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<
            ApiResponse<CategoryResponse>
            > getCategory(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh mục thành công",
                        categoryService.getById(id)
                )
        );
    }
}