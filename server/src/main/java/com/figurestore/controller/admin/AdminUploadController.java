package com.figurestore.controller.admin;

import com.figurestore.dto.response.ApiResponse;
import com.figurestore.dto.response.CloudinaryUploadResult;
import com.figurestore.service.interfaces.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/uploads")
@RequiredArgsConstructor
public class AdminUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping(
            value = "/product-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<
            ApiResponse<CloudinaryUploadResult>
            > uploadProductImage(
            @RequestPart("file") MultipartFile file
    ) {
        CloudinaryUploadResult result =
                cloudinaryService.uploadProductImage(file);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tải ảnh sản phẩm thành công",
                        result
                )
        );
    }
}