package com.figurestore.service.interfaces;

import com.figurestore.dto.request.ProductRequest;
import com.figurestore.dto.response.ProductResponse;
import com.figurestore.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    Page<ProductResponse> getPublicProducts(
            String keyword,
            Long categoryId,
            String brand,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featured,
            Boolean newProduct,
            String sort,
            int page,
            int size
    );

    Page<ProductResponse> getAdminProducts(
            String keyword,
            Long categoryId,
            ProductStatus status,
            String sort,
            int page,
            int size
    );

    ProductResponse getPublicProductById(Long id);

    ProductResponse getPublicProductBySlug(String slug);

    ProductResponse getAdminProductById(Long id);

    ProductResponse create(
            ProductRequest request,
            MultipartFile thumbnail,
            List<MultipartFile> images
    );

    ProductResponse update(
            Long id,
            ProductRequest request,
            MultipartFile thumbnail,
            List<MultipartFile> images
    );

    void hide(Long id);

    void deletePermanently(Long id);
}