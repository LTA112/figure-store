package com.figurestore.dto.request;

import com.figurestore.enums.ProductStatus;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(
            min = 2,
            max = 200,
            message = "Tên sản phẩm phải từ 2 đến 200 ký tự"
    )
    private String name;

    @Size(
            max = 220,
            message = "Slug không được vượt quá 220 ký tự"
    )
    private String slug;

    @Size(
            max = 10000,
            message = "Mô tả không được vượt quá 10000 ký tự"
    )
    private String description;

    @NotNull(message = "Giá sản phẩm không được để trống")
    @DecimalMin(
            value = "1000",
            message = "Giá sản phẩm phải từ 1.000 đồng"
    )
    @Digits(
            integer = 13,
            fraction = 2,
            message = "Giá sản phẩm không hợp lệ"
    )
    private BigDecimal price;

    @DecimalMin(
            value = "0",
            message = "Giá khuyến mãi không được âm"
    )
    @Digits(
            integer = 13,
            fraction = 2,
            message = "Giá khuyến mãi không hợp lệ"
    )
    private BigDecimal discountPrice;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(
            value = 0,
            message = "Số lượng tồn kho không được âm"
    )
    @Max(
            value = 1_000_000,
            message = "Số lượng tồn kho quá lớn"
    )
    private Integer stockQuantity;

    @Size(
            max = 50,
            message = "Tỉ lệ không được vượt quá 50 ký tự"
    )
    private String scaleRatio;

    @Size(
            max = 100,
            message = "Chất liệu không được vượt quá 100 ký tự"
    )
    private String material;

    @Size(
            max = 100,
            message = "Thương hiệu không được vượt quá 100 ký tự"
    )
    private String brand;

    @NotNull(message = "Danh mục không được để trống")
    @Positive(message = "Danh mục không hợp lệ")
    private Long categoryId;

    private ProductStatus status;

    private Boolean featured;

    private Boolean newProduct;

    /*
     * Khi cập nhật sản phẩm, frontend gửi ID ảnh muốn giữ lại.
     * Những ảnh không nằm trong danh sách này sẽ bị xóa.
     */
    private List<Long> retainedImageIds = new ArrayList<>();
}