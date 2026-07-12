package com.figurestore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ZaloPayCallbackResponse(

        @JsonProperty("return_code")
        Integer returnCode,

        @JsonProperty("return_message")
        String returnMessage

) {
}