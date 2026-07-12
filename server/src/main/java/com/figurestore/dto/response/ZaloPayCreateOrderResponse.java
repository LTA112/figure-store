package com.figurestore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ZaloPayCreateOrderResponse(

        @JsonProperty("return_code")
        Integer returnCode,

        @JsonProperty("return_message")
        String returnMessage,

        @JsonProperty("sub_return_code")
        Integer subReturnCode,

        @JsonProperty("sub_return_message")
        String subReturnMessage,

        @JsonProperty("order_url")
        String orderUrl,

        @JsonProperty("zp_trans_token")
        String zpTransToken

) {
}