package com.figurestore.service.impl;

import com.figurestore.dto.request.ProductRequest;
import com.figurestore.dto.response.CloudinaryUploadResult;
import com.figurestore.dto.response.ProductResponse;
import com.figurestore.entity.Category;
import com.figurestore.entity.Product;
import com.figurestore.entity.ProductImage;
import com.figurestore.enums.ProductStatus;
import com.figurestore.exception.AppException;
import com.figurestore.repository.CategoryRepository;
import com.figurestore.repository.ProductRepository;
import com.figurestore.service.interfaces.CloudinaryService;
import com.figurestore.service.interfaces.ProductService;
import com.figurestore.specification.ProductSpecification;
import com.figurestore.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl
        implements ProductService {

    private static final int MAX_DETAIL_IMAGES = 8;

    private final ProductRepository productRepository;

    private final CategoryRepository categoryRepository;

    private final CloudinaryService cloudinaryService;

    @Override
    public Page<ProductResponse> getPublicProducts(
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
    ) {
        validatePagination(page, size);
        validatePriceRange(minPrice, maxPrice);

        Specification<Product> specification =
                Specification
                        .where(
                                ProductSpecification
                                        .publicProduct()
                        )
                        .and(
                                ProductSpecification
                                        .keyword(keyword)
                        )
                        .and(
                                ProductSpecification
                                        .categoryId(categoryId)
                        )
                        .and(
                                ProductSpecification
                                        .brand(brand)
                        )
                        .and(
                                ProductSpecification
                                        .minimumPrice(minPrice)
                        )
                        .and(
                                ProductSpecification
                                        .maximumPrice(maxPrice)
                        )
                        .and(
                                ProductSpecification
                                        .featured(featured)
                        )
                        .and(
                                ProductSpecification
                                        .newProduct(newProduct)
                        );

        Pageable pageable = PageRequest.of(
                page,
                size,
                resolveSort(sort)
        );

        return productRepository
                .findAll(specification, pageable)
                .map(ProductResponse::fromEntity);
    }

    @Override
    public Page<ProductResponse> getAdminProducts(
            String keyword,
            Long categoryId,
            ProductStatus status,
            String sort,
            int page,
            int size
    ) {
        validatePagination(page, size);

        Specification<Product> specification =
                Specification
                        .where(
                                ProductSpecification
                                        .keyword(keyword)
                        )
                        .and(
                                ProductSpecification
                                        .categoryId(categoryId)
                        )
                        .and(
                                ProductSpecification
                                        .status(status)
                        );

        Pageable pageable = PageRequest.of(
                page,
                size,
                resolveSort(sort)
        );

        return productRepository
                .findAll(specification, pageable)
                .map(ProductResponse::fromEntity);
    }

    @Override
    public ProductResponse getPublicProductById(Long id) {
        Product product = productRepository
                .findByIdAndStatusNot(
                        id,
                        ProductStatus.INACTIVE
                )
                .orElseThrow(
                        () -> new AppException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy sản phẩm"
                        )
                );

        return ProductResponse.fromEntity(product);
    }

    @Override
    public ProductResponse getPublicProductBySlug(
            String slug
    ) {
        Product product = productRepository
                .findBySlugIgnoreCaseAndStatusNot(
                        slug,
                        ProductStatus.INACTIVE
                )
                .orElseThrow(
                        () -> new AppException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy sản phẩm"
                        )
                );

        return ProductResponse.fromEntity(product);
    }

    @Override
    public ProductResponse getAdminProductById(Long id) {
        return ProductResponse.fromEntity(
                findProduct(id)
        );
    }

    @Override
    @Transactional
    public ProductResponse create(
            ProductRequest request,
            MultipartFile thumbnail,
            List<MultipartFile> images
    ) {
        validateBusinessRequest(request);

        if (thumbnail == null || thumbnail.isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Ảnh đại diện sản phẩm là bắt buộc"
            );
        }

        validateDetailImageCount(0, images);

        Category category = findActiveCategory(
                request.getCategoryId()
        );

        String slug = resolveUniqueSlug(
                null,
                request.getSlug(),
                request.getName()
        );

        List<String> uploadedPublicIds =
                new ArrayList<>();

        try {
            CloudinaryUploadResult thumbnailResult =
                    cloudinaryService
                            .uploadProductImage(thumbnail);

            uploadedPublicIds.add(
                    thumbnailResult.getPublicId()
            );

            Product product = Product.builder()
                    .name(request.getName().trim())
                    .slug(slug)
                    .description(
                            normalizeNullable(
                                    request.getDescription()
                            )
                    )
                    .price(request.getPrice())
                    .discountPrice(
                            request.getDiscountPrice()
                    )
                    .stockQuantity(
                            request.getStockQuantity()
                    )
                    .soldQuantity(0)
                    .scaleRatio(
                            normalizeNullable(
                                    request.getScaleRatio()
                            )
                    )
                    .material(
                            normalizeNullable(
                                    request.getMaterial()
                            )
                    )
                    .brand(
                            normalizeNullable(
                                    request.getBrand()
                            )
                    )
                    .thumbnailUrl(
                            thumbnailResult.getUrl()
                    )
                    .thumbnailPublicId(
                            thumbnailResult.getPublicId()
                    )
                    .status(resolveStatus(request))
                    .featured(
                            Boolean.TRUE.equals(
                                    request.getFeatured()
                            )
                    )
                    .newProduct(
                            Boolean.TRUE.equals(
                                    request.getNewProduct()
                            )
                    )
                    .category(category)
                    .build();

            uploadDetailImages(
                    product,
                    images,
                    uploadedPublicIds
            );

            Product saved =
                    productRepository.save(product);

            return ProductResponse.fromEntity(saved);

        } catch (RuntimeException exception) {
            uploadedPublicIds.forEach(
                    cloudinaryService::deleteImage
            );

            throw exception;
        }
    }

    @Override
    @Transactional
    public ProductResponse update(
            Long id,
            ProductRequest request,
            MultipartFile thumbnail,
            List<MultipartFile> images
    ) {
        validateBusinessRequest(request);

        Product product = findProduct(id);

        Category category = findActiveCategory(
                request.getCategoryId()
        );

        String slug = resolveUniqueSlug(
                id,
                request.getSlug(),
                request.getName()
        );

        Set<Long> retainedIds = new HashSet<>(
                request.getRetainedImageIds() == null
                        ? List.of()
                        : request.getRetainedImageIds()
        );

        List<ProductImage> removedImages =
                product.getImages()
                        .stream()
                        .filter(
                                image -> !retainedIds.contains(
                                        image.getId()
                                )
                        )
                        .toList();

        int retainedCount =
                product.getImages().size()
                        - removedImages.size();

        validateDetailImageCount(
                retainedCount,
                images
        );

        String oldThumbnailPublicId =
                product.getThumbnailPublicId();

        List<String> newlyUploadedPublicIds =
                new ArrayList<>();

        try {
            product.setName(request.getName().trim());
            product.setSlug(slug);
            product.setDescription(
                    normalizeNullable(
                            request.getDescription()
                    )
            );
            product.setPrice(request.getPrice());
            product.setDiscountPrice(
                    request.getDiscountPrice()
            );
            product.setStockQuantity(
                    request.getStockQuantity()
            );
            product.setScaleRatio(
                    normalizeNullable(
                            request.getScaleRatio()
                    )
            );
            product.setMaterial(
                    normalizeNullable(
                            request.getMaterial()
                    )
            );
            product.setBrand(
                    normalizeNullable(
                            request.getBrand()
                    )
            );
            product.setCategory(category);
            product.setStatus(resolveStatus(request));
            product.setFeatured(
                    Boolean.TRUE.equals(
                            request.getFeatured()
                    )
            );
            product.setNewProduct(
                    Boolean.TRUE.equals(
                            request.getNewProduct()
                    )
            );

            if (thumbnail != null
                    && !thumbnail.isEmpty()) {
                CloudinaryUploadResult result =
                        cloudinaryService
                                .uploadProductImage(thumbnail);

                newlyUploadedPublicIds.add(
                        result.getPublicId()
                );

                product.setThumbnailUrl(
                        result.getUrl()
                );

                product.setThumbnailPublicId(
                        result.getPublicId()
                );
            }

            removedImages.forEach(
                    product::removeImage
            );

            uploadDetailImages(
                    product,
                    images,
                    newlyUploadedPublicIds
            );

            Product saved =
                    productRepository.saveAndFlush(product);

            if (thumbnail != null
                    && !thumbnail.isEmpty()) {
                cloudinaryService.deleteImage(
                        oldThumbnailPublicId
                );
            }

            removedImages.forEach(
                    image -> cloudinaryService.deleteImage(
                            image.getPublicId()
                    )
            );

            return ProductResponse.fromEntity(saved);

        } catch (RuntimeException exception) {
            newlyUploadedPublicIds.forEach(
                    cloudinaryService::deleteImage
            );

            throw exception;
        }
    }

    @Override
    @Transactional
    public void hide(Long id) {
        Product product = findProduct(id);

        product.setStatus(ProductStatus.INACTIVE);

        productRepository.save(product);
    }

    private void uploadDetailImages(
            Product product,
            List<MultipartFile> files,
            List<String> uploadedPublicIds
    ) {
        if (files == null || files.isEmpty()) {
            return;
        }

        int nextOrder = product.getImages().size();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            CloudinaryUploadResult result =
                    cloudinaryService
                            .uploadProductImage(file);

            uploadedPublicIds.add(result.getPublicId());

            ProductImage image = ProductImage.builder()
                    .imageUrl(result.getUrl())
                    .publicId(result.getPublicId())
                    .displayOrder(nextOrder++)
                    .build();

            product.addImage(image);
        }
    }

    private void validateBusinessRequest(
            ProductRequest request
    ) {
        if (request.getDiscountPrice() != null
                && request.getDiscountPrice()
                .compareTo(request.getPrice()) >= 0) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Giá khuyến mãi phải nhỏ hơn giá gốc"
            );
        }

        if (request.getDiscountPrice() != null
                && request.getDiscountPrice()
                .compareTo(BigDecimal.valueOf(1000)) < 0) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Giá khuyến mãi phải từ 1.000 đồng"
            );
        }
    }

    private void validateDetailImageCount(
            int retainedCount,
            List<MultipartFile> newImages
    ) {
        long validNewImageCount =
                newImages == null
                        ? 0
                        : newImages.stream()
                        .filter(
                                file -> file != null
                                        && !file.isEmpty()
                        )
                        .count();

        if (retainedCount + validNewImageCount
                > MAX_DETAIL_IMAGES) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Mỗi sản phẩm chỉ được có tối đa "
                            + MAX_DETAIL_IMAGES
                            + " ảnh chi tiết"
            );
        }
    }

    private Product findProduct(Long id) {
        return productRepository
                .findById(id)
                .orElseThrow(
                        () -> new AppException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy sản phẩm"
                        )
                );
    }

    private Category findActiveCategory(Long id) {
        Category category = categoryRepository
                .findById(id)
                .orElseThrow(
                        () -> new AppException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy danh mục"
                        )
                );

        if (!Boolean.TRUE.equals(category.getActive())) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Danh mục đã ngừng hoạt động"
            );
        }

        return category;
    }

    private ProductStatus resolveStatus(
            ProductRequest request
    ) {
        if (request.getStatus()
                == ProductStatus.INACTIVE) {
            return ProductStatus.INACTIVE;
        }

        if (request.getStockQuantity() <= 0) {
            return ProductStatus.OUT_OF_STOCK;
        }

        return ProductStatus.ACTIVE;
    }

    private String resolveUniqueSlug(
            Long currentId,
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
                    "Không thể tạo slug sản phẩm"
            );
        }

        boolean duplicated =
                currentId == null
                        ? productRepository
                        .existsBySlugIgnoreCase(slug)
                        : productRepository
                        .existsBySlugIgnoreCaseAndIdNot(
                                slug,
                                currentId
                        );

        if (duplicated) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "Slug sản phẩm đã tồn tại"
            );
        }

        return slug;
    }

    private Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(
                    Sort.Direction.DESC,
                    "createdAt"
            );
        }

        return switch (sort) {
            case "price_asc" ->
                    Sort.by(
                            Sort.Direction.ASC,
                            "price"
                    );
            case "price_desc" ->
                    Sort.by(
                            Sort.Direction.DESC,
                            "price"
                    );
            case "sold_desc" ->
                    Sort.by(
                            Sort.Direction.DESC,
                            "soldQuantity"
                    );
            case "name_asc" ->
                    Sort.by(
                            Sort.Direction.ASC,
                            "name"
                    );
            case "oldest" ->
                    Sort.by(
                            Sort.Direction.ASC,
                            "createdAt"
                    );
            default ->
                    Sort.by(
                            Sort.Direction.DESC,
                            "createdAt"
                    );
        };
    }

    private void validatePagination(
            int page,
            int size
    ) {
        if (page < 0) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Trang không hợp lệ"
            );
        }

        if (size < 1 || size > 100) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Số sản phẩm mỗi trang phải từ 1 đến 100"
            );
        }
    }

    private void validatePriceRange(
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        if (minPrice != null
                && minPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Giá tối thiểu không được âm"
            );
        }

        if (maxPrice != null
                && maxPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Giá tối đa không được âm"
            );
        }

        if (minPrice != null
                && maxPrice != null
                && minPrice.compareTo(maxPrice) > 0) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Giá tối thiểu không được lớn hơn giá tối đa"
            );
        }
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}