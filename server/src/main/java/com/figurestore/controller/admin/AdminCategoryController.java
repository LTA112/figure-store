package com.figurestore.controller.admin;

import com.figurestore.dto.request.CategoryRequest;
import com.figurestore.dto.response.ApiResponse;
import com.figurestore.dto.response.CategoryResponse;
import com.figurestore.service.interfaces.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<
            ApiResponse<List<CategoryResponse>>
            > getCategories() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh mục thành công",
                        categoryService.getAdminCategories()
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

    @PostMapping
    public ResponseEntity<
            ApiResponse<CategoryResponse>
            > create(
            @Valid
            @RequestBody
            CategoryRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Tạo danh mục thành công",
                                categoryService.create(request)
                        )
                );
    }

    @PutMapping("/{id}")
    public ResponseEntity<
            ApiResponse<CategoryResponse>
            > update(
            @PathVariable Long id,

            @Valid
            @RequestBody
            CategoryRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật danh mục thành công",
                        categoryService.update(id, request)
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id
    ) {
        categoryService.delete(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Xóa danh mục thành công",
                        null
                )
        );
    }
}