package com.figurestore.controller.admin;

import com.figurestore.dto.request.ProductRequest;
import com.figurestore.dto.response.ApiResponse;
import com.figurestore.dto.response.ProductResponse;
import com.figurestore.enums.ProductStatus;
import com.figurestore.service.interfaces.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

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
            ProductStatus status,

            @RequestParam(defaultValue = "newest")
            String sort,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "20")
            int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy sản phẩm thành công",
                        productService.getAdminProducts(
                                keyword,
                                categoryId,
                                status,
                                sort,
                                page,
                                size
                        )
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<
            ApiResponse<ProductResponse>
            > getProduct(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy sản phẩm thành công",
                        productService
                                .getAdminProductById(id)
                )
        );
    }

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<
            ApiResponse<ProductResponse>
            > create(
            @Valid
            @RequestPart("product")
            ProductRequest request,

            @RequestPart("thumbnail")
            MultipartFile thumbnail,

            @RequestPart(
                    value = "images",
                    required = false
            )
            List<MultipartFile> images
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Tạo sản phẩm thành công",
                                productService.create(
                                        request,
                                        thumbnail,
                                        images
                                )
                        )
                );
    }

    @PutMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<
            ApiResponse<ProductResponse>
            > update(
            @PathVariable Long id,

            @Valid
            @RequestPart("product")
            ProductRequest request,

            @RequestPart(
                    value = "thumbnail",
                    required = false
            )
            MultipartFile thumbnail,

            @RequestPart(
                    value = "images",
                    required = false
            )
            List<MultipartFile> images
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật sản phẩm thành công",
                        productService.update(
                                id,
                                request,
                                thumbnail,
                                images
                        )
                )
        );
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<ApiResponse<Void>> deletePermanently(
            @PathVariable Long id
    ) {
        productService.deletePermanently(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Xóa sản phẩm vĩnh viễn thành công",
                        null
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> hide(
            @PathVariable Long id
    ) {
        productService.hide(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Ẩn sản phẩm thành công",
                        null
                )
        );
    }
}