package com.figurestore.controller;

import com.figurestore.dto.response.ApiResponse;
import com.figurestore.dto.response.ProductResponse;
import com.figurestore.service.interfaces.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<
            ApiResponse<Page<ProductResponse>>
            > getProducts(
            @RequestParam(required = false)
            String keyword,

            @RequestParam(required = false)
            Long categoryId,

            @RequestParam(required = false)
            String brand,

            @RequestParam(required = false)
            BigDecimal minPrice,

            @RequestParam(required = false)
            BigDecimal maxPrice,

            @RequestParam(required = false)
            Boolean featured,

            @RequestParam(required = false)
            Boolean newProduct,

            @RequestParam(defaultValue = "newest")
            String sort,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {
        Page<ProductResponse> result =
                productService.getPublicProducts(
                        keyword,
                        categoryId,
                        brand,
                        minPrice,
                        maxPrice,
                        featured,
                        newProduct,
                        sort,
                        page,
                        size
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy sản phẩm thành công",
                        result
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<
            ApiResponse<ProductResponse>
            > getById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy sản phẩm thành công",
                        productService
                                .getPublicProductById(id)
                )
        );
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<
            ApiResponse<ProductResponse>
            > getBySlug(
            @PathVariable String slug
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy sản phẩm thành công",
                        productService
                                .getPublicProductBySlug(slug)
                )
        );
    }
}