package com.figurestore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(
            min = 2,
            max = 100,
            message = "Tên danh mục phải từ 2 đến 100 ký tự"
    )
    private String name;

    @Size(
            max = 120,
            message = "Slug không được vượt quá 120 ký tự"
    )
    private String slug;

    @Size(
            max = 2000,
            message = "Mô tả không được vượt quá 2000 ký tự"
    )
    private String description;

    private Boolean active;
}