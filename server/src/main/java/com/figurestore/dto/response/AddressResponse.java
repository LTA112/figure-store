package com.figurestore.dto.response;

public record AddressResponse(
        Long id,
        String label,
        String recipientName,
        String phone,
        String province,
        String district,
        String ward,
        String detailAddress,
        boolean defaultAddress
) {
}