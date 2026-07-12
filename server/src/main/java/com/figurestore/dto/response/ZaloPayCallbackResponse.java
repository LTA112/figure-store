package com.figurestore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ZaloPayCallbackResponse(

        @JsonProperty("returncode")
        Integer returnCode,

        @JsonProperty("returnmessage")
        String returnMessage

) {
}