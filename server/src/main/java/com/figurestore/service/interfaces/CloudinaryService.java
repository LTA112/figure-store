package com.figurestore.service.interfaces;

import com.figurestore.dto.response.CloudinaryUploadResult;
import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {

    CloudinaryUploadResult uploadProductImage(
            MultipartFile file
    );

    void deleteImage(String publicId);
}