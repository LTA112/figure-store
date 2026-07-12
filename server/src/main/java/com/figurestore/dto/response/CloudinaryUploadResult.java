package com.figurestore.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CloudinaryUploadResult {

    private String publicId;

    private String url;

    private String format;

    private Long bytes;

    private Integer width;

    private Integer height;
}