package com.figurestore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressRequest(

        @NotBlank(
                message =
                        "Tên địa chỉ không được để trống"
        )
        @Size(
                max = 100,
                message =
                        "Tên địa chỉ không được vượt quá 100 ký tự"
        )
        String label,

        @NotBlank(
                message =
                        "Tên người nhận không được để trống"
        )
        @Size(
                max = 100,
                message =
                        "Tên người nhận không được vượt quá 100 ký tự"
        )
        String recipientName,

        @NotBlank(
                message =
                        "Số điện thoại không được để trống"
        )
        @Pattern(
                regexp =
                        "^(0|\\+84)[0-9]{9,10}$",
                message =
                        "Số điện thoại không hợp lệ"
        )
        String phone,

        @NotBlank(
                message =
                        "Tỉnh hoặc thành phố không được để trống"
        )
        @Size(
                max = 120,
                message =
                        "Tỉnh hoặc thành phố không được vượt quá 120 ký tự"
        )
        String province,

        /*
         * Sau sắp xếp hành chính năm 2025,
         * địa chỉ mới dùng mô hình hai cấp:
         * tỉnh/thành phố và phường/xã.
         *
         * Field district vẫn được giữ để
         * tương thích dữ liệu cũ nhưng
         * không còn bắt buộc.
         */
        @Size(
                max = 120,
                message =
                        "Quận hoặc huyện không được vượt quá 120 ký tự"
        )
        String district,

        @NotBlank(
                message =
                        "Phường hoặc xã không được để trống"
        )
        @Size(
                max = 120,
                message =
                        "Phường hoặc xã không được vượt quá 120 ký tự"
        )
        String ward,

        @NotBlank(
                message =
                        "Địa chỉ chi tiết không được để trống"
        )
        @Size(
                max = 255,
                message =
                        "Địa chỉ chi tiết không được vượt quá 255 ký tự"
        )
        String detailAddress,

        boolean defaultAddress

) {
}