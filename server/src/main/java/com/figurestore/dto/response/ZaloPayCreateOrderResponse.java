package com.figurestore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ZaloPayCreateOrderResponse(

        @JsonProperty("returncode")
        Integer returnCode,

        @JsonProperty("returnmessage")
        String returnMessage,

        @JsonProperty("orderurl")
        String orderUrl,

        @JsonProperty("zptranstoken")
        String zpTransToken

) {
}