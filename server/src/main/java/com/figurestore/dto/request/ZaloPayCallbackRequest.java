package com.figurestore.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ZaloPayCallbackRequest(

        String data,

        String mac,

        @JsonProperty("type")
        Integer type

) {
}