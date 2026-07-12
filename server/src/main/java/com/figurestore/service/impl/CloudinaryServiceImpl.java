package com.figurestore.service.impl;

import com.cloudinary.Cloudinary;
import com.figurestore.dto.response.CloudinaryUploadResult;
import com.figurestore.exception.AppException;
import com.figurestore.service.interfaces.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl
        implements CloudinaryService {

    private static final long MAX_IMAGE_SIZE =
            10L * 1024L * 1024L;

    private static final List<String> ALLOWED_TYPES =
            List.of(
                    "image/jpeg",
                    "image/png",
                    "image/webp"
            );

    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder:figure-store}")
    private String cloudinaryFolder;

    @Override
    public CloudinaryUploadResult uploadProductImage(
            MultipartFile file
    ) {
        validateImage(file);

        try {
            Map<String, Object> uploadOptions =
                    new HashMap<>();

            uploadOptions.put(
                    "folder",
                    cloudinaryFolder + "/products"
            );

            uploadOptions.put(
                    "public_id",
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
            );

            uploadOptions.put(
                    "resource_type",
                    "image"
            );

            uploadOptions.put(
                    "overwrite",
                    false
            );

            Map<?, ?> result =
                    cloudinary
                            .uploader()
                            .upload(
                                    file.getBytes(),
                                    uploadOptions
                            );

            return CloudinaryUploadResult.builder()
                    .publicId(
                            stringValue(
                                    result.get(
                                            "public_id"
                                    )
                            )
                    )
                    .url(
                            stringValue(
                                    result.get(
                                            "secure_url"
                                    )
                            )
                    )
                    .format(
                            stringValue(
                                    result.get(
                                            "format"
                                    )
                            )
                    )
                    .bytes(
                            longValue(
                                    result.get(
                                            "bytes"
                                    )
                            )
                    )
                    .width(
                            integerValue(
                                    result.get(
                                            "width"
                                    )
                            )
                    )
                    .height(
                            integerValue(
                                    result.get(
                                            "height"
                                    )
                            )
                    )
                    .build();

        } catch (IOException exception) {
            throw new AppException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể tải ảnh lên Cloudinary"
            );
        }
    }

    @Override
    public void deleteImage(String publicId) {
        if (publicId == null
                || publicId.isBlank()) {
            return;
        }

        try {
            Map<String, Object> deleteOptions =
                    new HashMap<>();

            deleteOptions.put(
                    "resource_type",
                    "image"
            );

            deleteOptions.put(
                    "invalidate",
                    true
            );

            cloudinary
                    .uploader()
                    .destroy(
                            publicId,
                            deleteOptions
                    );

        } catch (IOException exception) {
            /*
             * Không làm lỗi request cập nhật sản phẩm
             * nếu Cloudinary tạm thời không xóa được
             * ảnh cũ.
             */
            System.err.println(
                    "Không thể xóa ảnh Cloudinary: "
                            + publicId
            );

            System.err.println(
                    exception.getMessage()
            );
        }
    }

    private void validateImage(
            MultipartFile file
    ) {
        if (file == null || file.isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn ảnh"
            );
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Mỗi ảnh không được lớn hơn 10MB"
            );
        }

        String contentType =
                file.getContentType();

        if (contentType == null
                || !ALLOWED_TYPES.contains(
                contentType.toLowerCase(
                        Locale.ROOT
                )
        )) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP"
            );
        }
    }

    private String stringValue(Object value) {
        return value == null
                ? null
                : value.toString();
    }

    private Long longValue(Object value) {
        if (value == null) {
            return null;
        }

        return Long.valueOf(
                value.toString()
        );
    }

    private Integer integerValue(Object value) {
        if (value == null) {
            return null;
        }

        return Integer.valueOf(
                value.toString()
        );
    }
}